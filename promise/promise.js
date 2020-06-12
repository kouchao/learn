'use strict';
function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
// 获得then方法 进行try catch
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
// 函数调用一个参数 进行try catch
function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
// 函数调用两个参数 进行try catch
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

// module.exports = Promise;

function Promise(fn) {
  // Promise 必须是new调用
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  // fn 必须是一个函数
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  // 队列状态
  this._deferredState = 0;
  // 状态
  this._state = 0;
  // 终值
  this._value = null;
  // 队列
  this._deferreds = null;

  // 是空函数则返回
  if (fn === noop) return;

  // 去执行函数
  doResolve(fn, this);
}
Promise._onHandle = null;
Promise._onReject = null;
Promise._noop = noop;

// 实际上相当于 将任务加入了队列
Promise.prototype.then = function(onFulfilled, onRejected) {

  //? 安全的then 避免继承之类的将then改变
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }

  
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));

  // 创造了一个新的Promise 做到了链式调用
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}

// 开始注册任务到队列中  此处一定是从.then
function handle(self, deferred) {
  //? 状态是3代表 then返回的值是一个Promise的情况，找到最后一个不是Promise的情况
  while (self._state === 3) {
    //  改变 执行的Promise
    self = self._value;
  }
  if (Promise._onHandle) {
    Promise._onHandle(self);
  }

  // 如果状态是 0 表示Promise执行中未完成
  if (self._state === 0) {
    //? 加入队列   状态1和2的不同就是 数组还是不是数组。。。。。很让人迷惑的好不
    if (self._deferredState === 0) {
      self._deferredState = 1;
      self._deferreds = deferred;
      return;
    }
    if (self._deferredState === 1) {
      self._deferredState = 2;
      self._deferreds = [self._deferreds, deferred];
      return;
    }
    self._deferreds.push(deferred);
    return;
  }

  // 如果已经完成了.then的方法
  handleResolved(self, deferred);
}

// 执行.then的方法
function handleResolved(self, deferred) {
  setTimeout(() => {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      // 空的.then 直接下一个
      if (self._state === 1) {
        resolve(deferred.promise, self._value);
      } else {
        reject(deferred.promise, self._value);
      }
      return;
    }
    // 调用.then
    var ret = tryCallOne(cb, self._value);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}

// 调用了 执行 函数
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  // 避免返回自己
  if (newValue === self) {
    // 调用了自己 调用拒绝
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  // 执行的值   如果是一个类Promise（含有.then thenable）or Promise类 的话  应该先执行Promise
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      // 获取.then错误 调用了拒绝
      return reject(self, LAST_ERROR);
    }

    // 是Promise类
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      // newValue是一个Promise
      self._state = 3;
      self._value = newValue;
      finale(self); // 结束
      return;
    } else if (typeof then === 'function') {
      // 是类Promise

      //? 直接调用then方法  xxx.then() 需要调试跟踪
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._state = 1;
  self._value = newValue;
  finale(self);
}

// 调用了 拒绝 函数  基本同 执行 函数 只是状态不一样
function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  if (Promise._onReject) {
    Promise._onReject(self, newValue);
  }
  finale(self);
}

// 最后处理 如果没有。then  可以认为队列中就不会有任务，也就是说_deferredState 就始终为0 也就不会执行什么
function finale(self) {
  // 队列状态是 1
  if (self._deferredState === 1) {
    handle(self, self._deferreds);
    self._deferreds = null;
  }

  // 队列状态是 2
  if (self._deferredState === 2) {
    for (var i = 0; i < self._deferreds.length; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }
}

// 判断onFulfilled onRejected 不是函数的话应该忽略
function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
// 执行函数，并且检查错误
function doResolve(fn, promise) {
  // 函数执行状态 确保只被调用一次resolve or reject
  var done = false;
  
  // 调用new Promise(fn) 的 fn
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    // 函数中调用执行
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    // 函数中调用拒绝
    reject(promise, reason);
  });
  // fn出现错误 调用拒绝
  if (!done && res === IS_ERROR) {
    done = true;
    // 拒绝
    reject(promise, LAST_ERROR);
  }
}

Promise.deferred = function () {
  const defer = {}
  defer.promise = new Promise((resolve, reject) => {
    defer.resolve = resolve
    defer.reject = reject
  })
  return defer
}


// new Promise((resolve, reject) => {
//   // resolve(2)
//   setTimeout(() => {
//     resolve(new Promise((r, re) => {
//       setTimeout(() => {
//         r('111')
//       }, 1000)
//     }))
//   }, 1000)
// }).then(res => {
//   console.log(res)
//   return new Promise((resolve, reject) => {
//     setTimeout(() => {
//       resolve(new Promise((r, re) => {
//         setTimeout(() => {
//           r('222')
//         }, 1000)
//       }))
//     }, 1000)
//   })
// }).then().then().then()
// .then(res => {
//   console.log(res)
// })

// 1
// 没有.then
// doResolve -> resolve -> finale

// new Promise((resolve, reject) => {
//   resolve(1)
// })

// 1.1
// doResolve -> resolve -> finale
// then -> handle ->      ->  tryCallOne  -> resolve(下一个)
//         返回ret    异步 ->

new Promise((resolve, reject) => {
  resolve(1)
}).then(res => {
  console.log(res)
})

// 2 doResolve -> 过了1会 resolve -> finale

// new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve(1)
//   })
// })

// 3