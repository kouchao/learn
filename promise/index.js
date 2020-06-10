class Promise {
  status = Promise.PENDING
  value = null
  fulfilledCallbacks = []
  rejectedCallbacks = []
  constructor(fn) {
    fn(this._resolve.bind(this), this._reject.bind(this))
  }

  then(onFulfilled, onRejected) {
    return new Promise((resolve, reject) => {
      this._handle({
        onFulfilled,
        resolve,
        onRejected,
        reject,
      })
    })
  }

  _handle(callback) {
    if (this.status === Promise.PENDING) {
      this.callbacks.push(callback)
      return
    }
    try {
      if (this.status === Promise.FULFILLED) {
        const ret = callback.onFulfilled(this.value)
        callback.resolve(ret)
        return 
      }
  
      if (this.status === Promise.REJECTED) {
        const ret = callback.onRejected(this.value)
        callback.reject(ret)
      }
    } catch (error) {
      callback.reject(error)
    }
  }

  _resolve(value) {
    if ((value && typeof value === 'function') || typeof value === 'object') {
      const then = value.then
      if (typeof then === 'function') {
        then.call(value, this._resolve.bind(this))
      }
      return
    }

    this.status = Promise.FULFILLED
    this.value = value
    this.fulfilledCallbacks.forEach((callback) => this._handle(callback))
  }

  _reject(value) {
    if ((value && typeof value === 'function') || typeof value === 'object') {
      const then = value.then
      if (typeof then === 'function') {
        then.call(value, this._resolve.bind(this), this._reject.bind(this))
      }
      return
    }

    this.status = Promise.REJECTED
    this.value = value
    this.rejectedCallbacks.forEach((callback) => this._handle(callback))
  }
}

Promise.PENDING = 'pending'
Promise.FULFILLED = 'fulfilled'
Promise.REJECTED = 'rejected'

module.exports = Promise
