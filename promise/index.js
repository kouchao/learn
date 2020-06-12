const noop = () => {}

class Promise {
  status = 0
  callbacks = []
  value = false
  constructor(fn) {
    if (fn === noop) {
      return
    }
    fn((value) => {
      this._resolve(value)
    })
  }

  _resolve(value) {
    console.log('_resolve')
    this.status = 1
    this.value = value
  }

  then(onFulfilled) {
    console.log('then')

    const promise = new Promise(noop)

    this.handle({
      onFulfilled,
      promise,
    })

    return promise
  }

  handle(callback) {
    if (this.status === 0) {
      this.callbacks.push(callback)
    } else {
      setTimeout(() => {
        const value = callback.onFulfilled(this.value)

        if (value && value.then) {
          value.then((val) => {
            callback.promise._resolve(val)
          })
        } else {
          callback.promise._resolve(value)
        }
      })
    }

    setTimeout(() => {
      if (this.status === 1) {
        this.callbacks.forEach((callback) => {
          const value = callback.onFulfilled(this.value)
          callback.promise._resolve(value)
        })
      }
    })
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

// module.exports = Promise
new Promise((resolve) => {
  resolve('111')
})
  .then((res) => {
    console.log('res', res)
    return new Promise((resolve) => {
      resolve('222')
    })
  })
  .then((res) => {
    console.log('res2', res)
  })
