let proto = {

}
// __defineGetter__ 方法可以将一个函数绑定在当前对象的指定属性上，当那个属性的值被读取时，你所绑定的函数就会被调用。
function defineGetter(prop, name){ // 创建一个defineGetter函数，参数分别是要代理的对象和对象上的属性
    proto.__defineGetter__(name, function(){ // 每个对象都有一个__defineGetter__方法，可以用这个方法实现代理，下面详解
        return this[prop][name] // 这里的this是ctx（原因下面解释），所以ctx.url得到的就是this.request.url
    })
}
function defineSetter (prop, name) {
    proto.__defineSetter__(name, function(val){ // 用__defineSetter__方法设置值
        this[prop][name] = val
    })
}

defineGetter('request', 'url')
defineGetter('request', 'path')
defineGetter('response', 'body') // 同样代理response的body属性
defineSetter('response', 'body') // 同理
module.exports = proto