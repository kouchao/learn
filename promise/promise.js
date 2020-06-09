// 有三个状态
// 等待 -》 执行
// 等待 -》 拒绝
// 状态不可逆
// 执行态必须有不可变的终值
// 拒绝态必须有不可变的据因（===即认为是不可变）

// 有then方法
//? 可以访问其当终值和据因。
// promise.then(onFulfilled, onRejected) 参数可选
//? 参数不是函数将会忽略
// 可以被同一个 promise 调用多次
// promise 成功执行时，所有 onFulfilled 需按照其注册顺序依次回调
//  promise 被拒绝执行时，所有的 onRejected 需按照其注册顺序依次回调



// onFulfilled
// promise执行后必须被调用 第一个参数是终值
// promise执行前不能被调用
// 调用次数不能超过一次
// 必须是函数调用 即没有this


// onRejected
// promise执行后须被调用 第一个参数是据因
// promise执行前不能被调用
// 调用次数不能超过一次
// 必须是函数调用 即没有this

class Promise {
  constructor(){
    this.status = null
    this.value = null
  }

  then(onFulfilled, onRejected){

  }
}

Promise.PENDING = 'pending'
Promise.FULFILLED = 'fulfilled'
Promise.REJECTED = 'rejected'

module.exports = Promise