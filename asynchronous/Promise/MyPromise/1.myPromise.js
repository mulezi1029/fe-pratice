const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

function MyPromise(executor) {
  this.status = PENDING
  this.value = undefined
  this.reason = undefined
  // 存储 then 方法中注册的回调函数
  this.onFulfilledCallbacks = []
  this.onRejectedCallbacks = []

  const thisPromise = this

  function resolve(value) {
    if (thisPromise.status !== PENDING) return
    thisPromise.status = FULFILLED
    thisPromise.value = value
    // promise的状态变更为fulfilled后，调用所有通过 then 注册的 onFulfilled 回调函数
    thisPromise.onFulfilledCallbacks.forEach((callback) => {
      callback(thisPromise.value)
    })
    // 清空回调队列，避免重复调用
    thisPromise.onFulfilledCallbacks = []
  }

  function reject(reason) {
    if (thisPromise.status !== PENDING) return
    thisPromise.status = REJECTED
    thisPromise.reason = reason
    // promise的状态变更为rejected后，调用所有通过 then 注册的 onRejected 回调函数
    thisPromise.onRejectedCallbacks.forEach((callback) => {
      callback(thisPromise.reason)
    })
    // 清空回调队列，避免重复调用
    thisPromise.onRejectedCallbacks = []
  }

  try {
    executor(resolve, reject)
  } catch (error) {
    reject(error)
  }
}

/**
 * then 方法：
 * 接受 onFulfilled 和 onRejected 回调函数
 * 检查当前 Promise 的状态：
 *  - 如果是 fulfilled，则调用 onFulfilled 并传递 value
 *  - 如果是 rejected，则调用 onRejected 并传递 reason
 *  - 如果是 pending，则将 onFulfilled 和 onRejected 加入到回调队列中，以便在该 promise 的状态变更时，从队列中取出并调用
 *
 * 返回一个新的 Promise 实例
 *
 * @param {Function} onFulfilled promise 成功时的回调函数
 * @param {Function} onRejected promise 失败时的回调函数
 * @returns {MyPromise} 返回一个新的 Promise 实例, 该实例的状态由 onFulfilled 或 onRejected 回调函数的执行过程与返回值决定；
 *  - 如果 onFulfilled 或 onRejected 回调函数抛出异常，则将异常作为新 Promise 的拒绝原因（rejected）
 *  - 如果 onFulfilled 或 onRejected 回调函数返回一个 Promise 实例，则将该 Promise 实例的状态作为新 Promise 的状态
 *  - 如果 onFulfilled 或 onRejected 回调函数返回一个非 Promise 值，则将该值作为新 Promise 的成功值（fulfilled）
 * */
MyPromise.prototype.then = function (onFulfilled, onRejected) {
  // 处理参数，确保 onFulfilled 和 onRejected 都是函数类型
  const realOnFulfilled =
    typeof onFulfilled === 'function' ? onFulfilled : (value) => value
  const realOnRejected =
    typeof onRejected === 'function'
      ? onRejected
      : (reason) => {
        throw reason
      }
  
  let newPromiseResolve
  let newPromiseReject

  // then 方法返回一个新的 Promise 实例
  const newPromise = new MyPromise((resolve, reject) => {
    newPromiseResolve = resolve
    newPromiseReject = reject
  })

  // 检查当前promise的状态
  // 已完成则调用 onFulfilled 并传递 value
  if (this.status === FULFILLED) {
    try {
      realOnFulfilled(this.value)
    } catch (error) {
      // 如果 onFulfilled 抛出异常，则将异常作为新 Promise 的拒绝原因
      newPromiseReject(error)
    }
  }

  // 已拒绝则调用 onRejected 并传递 reason
  if (this.status === REJECTED) {
    try {
      realOnRejected(this.reason)
    } catch (error) {
      // 如果 onRejected 抛出异常，则将异常作为新 Promise 的拒绝原因
      newPromiseReject(error)
    }
  }

  // 当前状态为 pending 时，将 onFulfilled 和 onRejected 加入到回调队列中
  if (this.status === PENDING) {
    this.onFulfilledCallbacks.push(() => {
      try {
        realOnFulfilled(this.value)
      } catch (error) {
        // 如果 onFulfilled 抛出异常，则将异常作为新 Promise 的拒绝原因
        newPromiseReject(error)
      }
    })
    this.onRejectedCallbacks.push(() => {
      try {
        realOnRejected(this.reason)
      } catch (error) {
        // 如果 onRejected 抛出异常，则将异常作为新 Promise 的拒绝原因
        newPromiseReject(error)
      }
    })
  }

  return newPromise
}

// TEST
const request = fetch

var promise1 = new MyPromise((resolve) => {
  request('https://www.baidu.com').then((response) => {
    if (response.status === 200) {
      resolve('request1 success')
    }
  })
})

promise1.then(function (value) {
  console.log(value)
})

var promise2 = new MyPromise((resolve, reject) => {
  request('https://www.baidu.com').then((response) => {
    if (response.status === 200) {
      reject('request2 failed')
    }
  })
})

promise2.then(
  function (value) {
    console.log(value)
  },
  function (reason) {
    console.log(reason)
  }
)
