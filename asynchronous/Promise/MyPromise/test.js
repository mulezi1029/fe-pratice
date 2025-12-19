    class MyPromise {
      static PENDING = 'pending'
      static FULFILLED = 'fulfilled'
      static REJECTED = 'rejected'

      _fulfilledCallbacks = []
      _rejectedCallbacks = []

      queueMicrotask(callback) {
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(callback)
        } else if(typeof process === 'object' && typeof process.nextTick === 'function'){
          process.nextTick(callback)
        }else if(typeof MutationObserver === 'function'){
          const observer = new MutationObserver(callback)
          const node = document.createElement('div')
          observer.observe(node, { attributes: true })
          node.setAttribute('data-attribute', 'mutation')
        }else{
          setTimeout(callback, 0)
        }
      }

      _isPromiseLike(obj) {
        return typeof obj?.then === 'function'
      }

      resolve(result) {
        if (this.promiseState !== MyPromise.PENDING) return
        this.promiseState = MyPromise.FULFILLED
        this.promiseResult = result
        // promise的状态变更为fulfilled后，调用所有通过 then 注册的 onFulfilled 回调函数
        this._fulfilledCallbacks.forEach(callback => callback(this.promiseResult))
         // 清空回调队列，避免重复调用
        this._fulfilledCallbacks = []
      }

      reject(reason) {
        if (this.promiseState !== MyPromise.PENDING) return
        this.promiseState = MyPromise.REJECTED
        this.promiseResult = reason
        // promise的状态变更为rejected后，调用所有通过 then 注册的 onRejected 回调函数
        this._rejectedCallbacks.forEach(callback => callback(this.promiseResult))
        // 清空回调队列，避免重复调用
        this._rejectedCallbacks = []
      }

      constructor(executor) {
        this.promiseState = MyPromise.PENDING
        this.promiseResult = null
        try {
          executor(this.resolve.bind(this), this.reject.bind(this))
        } catch (error) {
          this.reject(error)
        }
      }


      /**
       *  then 方法
       * @description  
       *  检查当前 Promise 的状态：
       *  - 如果是 fulfilled，则调用 onFulfilled 并传递 value
       *  - 如果是 rejected，则调用 onRejected 并传递 reason
       *  - 如果是 pending，则将 onFulfilled 和 onRejected 加入到回调队列中，以便在该 promise 的状态变更时，从队列中取出并调用  
       * @param {*} onFulfilled 成功回调函数
       * @param {*} onRejected 失败回调函数
       * @returns {*} thenPromise。
       *  新的Promise 实例状态由 onFulfilled 或 onRejected 回调函数的执行过程与返回值决定；
        *  - 如果 onFulfilled 或 onRejected 回调函数抛出异常，则将异常作为新 Promise 的拒绝原因（rejected）
        *  - 如果 onFulfilled 或 onRejected 回调函数返回一个 Promise 实例，则将该 Promise 实例的状态作为新 Promise 的状态
        *  - 如果 onFulfilled 或 onRejected 回调函数返回一个非 Promise 值，则将该值作为新 Promise 的成功值（fulfilled）
       * **/
      then(onFulfilled, onRejected) {
        // 处理参数，确保 onFulfilled 和 onRejected 都是函数类型
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

        // then 返回一个新的Promise对象
        let thenPromiseResolve, thenPromiseReject
        const thenPromise = new MyPromise((resolve, reject) => {
          thenPromiseResolve = resolve
          thenPromiseReject = reject
        })

        // 处理回调执行时机，确保异步执行。同时基于回调执行结果，处理 thenPromise 的状态变更
        const realOnFulfilled = () => {
          this.queueMicrotask(() => {
            try {
              const result = onFulfilled(this.promiseResult)
              if(this._isPromiseLike(result)){
                result.then(thenPromiseResolve, thenPromiseReject)
              } else {
                thenPromiseResolve(result)
              }
            } catch (error) {
              thenPromiseReject(error)
            }
          })
        }

        const realOnRejected = () => {
          this.queueMicrotask(() => {
            try {
              const result = onRejected(this.promiseResult)
              if (result == thenPromise) {
                thenPromiseReject(new TypeError('Chaining cycle detected for promise #<Promise>'))
              }else if(this._isPromiseLike(result)){
                result.then((res) => {
                  
                }, thenPromiseReject)
              } else {
                thenPromiseResolve(result)
              }
            } catch (error) {
              thenPromiseReject(error)
            }
          })
        }

        // 根据当前promise的状态，处理回调函数的调用逻辑
        // pending 状态下，将回调函数加入到对应队列中，等待状态变更时被调用
        if(this.promiseState === MyPromise.PENDING){
          this._fulfilledCallbacks.push(realOnFulfilled)
          this._rejectedCallbacks.push(realOnRejected)
        }

        // 已完成则调用 onFulfilled 并传递 value
        if(this.promiseState === MyPromise.FULFILLED){
          realOnFulfilled()
        }

        // 已拒绝则调用 onRejected 并传递 reason
        if(this.promiseState === MyPromise.REJECTED){
          realOnRejected()
        }



        // 返回新的 Promise 实例
        return thenPromise
      }

      static deferred() {
        const deferred = {}
        deferred.promise = new MyPromise((resolve, reject) => {
          deferred.resolve = resolve
          deferred.reject = reject
        })
        return deferred
      }
    }

    // 导出供 Promises/A+ 测试使用
module.exports = MyPromise;