let http = require('http')
let EventEmitter = require('events')
let Stream = require('stream') // 引入stream
let context = require('./context')
let request = require('./request')
let response = require('./response')

class Koa extends EventEmitter {
  constructor () {
    super()
    this.middlewares = [] // 需要一个数组将每个中间件按顺序存放起来
    this.context = context // 将三个模块保存，全局的放到实例上
    this.request = request
    this.response = response
  }
  use (fn) {
    this.middlewares.push(fn) // 每次use，把当前回调函数存进数组
  }
  compose(middlewares, ctx){ // 简化版的compose，接收中间件数组、ctx对象作为参数
    function dispatch(index){
      if(index === middlewares.length) return Promise.resolve() // 若最后一个中间件，返回一个resolve的promise
      let middleware = middlewares[index]
      return Promise.resolve(middleware(ctx, () => dispatch(index + 1))) // 用Promise.resolve把中间件包起来
    }
    dispatch(0)
  }
  createContext(req, res){ // 这是核心，创建ctx
    // 使用Object.create方法是为了继承this.context但在增加属性时不影响原对象
    const ctx = Object.create(this.context)
    const request = ctx.request = Object.create(this.request)
    const response = ctx.response = Object.create(this.response)
    // 请仔细阅读以下眼花缭乱的操作，后面是有用的
    ctx.req = request.req = response.req = req
    ctx.res = request.res = response.res = res
    request.ctx = response.ctx = ctx
    request.response = response
    response.request = request
    return ctx
  }
  handleRequest(req,res){
    res.statusCode = 404 // 默认404
    let ctx = this.createContext(req, res)
    let fn = this.compose(this.middlewares, ctx)
    fn.then(() => { // then了之后再进行判断
      if(typeof ctx.body == 'object'){
          res.setHeader('Content-Type', 'application/json;charset=utf8')
          res.end(JSON.stringify(ctx.body))
      } else if (ctx.body instanceof Stream){
          ctx.body.pipe(res)
      }
      else if (typeof ctx.body === 'string' || Buffer.isBuffer(ctx.body)) {
          res.setHeader('Content-Type', 'text/htmlcharset=utf8')
          res.end(ctx.body)
      } else {
          res.end('Not found')
      }
    }).catch(err => { // 监控错误发射error，用于app.on('error', (err) =>{})
        this.emit('error', err)
        res.statusCode = 500
        res.end('server error')
    })
  }
  listen (...args) {
    let server = http.createServer(this.handleRequest.bind(this))// 这里使用bind调用，以防this丢失
    server.listen(...args)
  }
}



module.exports = Koa
