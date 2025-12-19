/**
 * 自定义Promise实现:
 * 1. Promise 接受一个执行器函数为参数，该执行器函数会立即执行，并接受两个函数作为参数：resolve 和 reject。
 *    resolve 与 reject 是 Promise 内部实现的两个函数，用于改变 Promise 的状态。
 *    其中，resolve 用于将 Promise 的状态从pending 改为 fulfilled，reject 用于将 Promise 的状态从 pending 改为 rejected。
 *    resolve 与 reject 都接受一个参数，resolve 的参数表示 Promise 成功的结果，reject 的参数表示 Promise 失败的原因。
 * 2. Promise的状态有三种：pending、fulfilled、rejected。Promise的状态只能从pending变为fulfilled 或
 *    rejected。Promise的结果只能被设置一次。
 * 3. executor 函数执行过程中，如果出现错误或者抛出异常，则需要调用 reject 函数来改变 Promise 的状态为
 *    reject。
 *
 */
class MyPromise {
	constructor(executor) {
		// 1. 初始状态为 pending
		this._state = 'pending'
		// 2. 存储成功的结果值或失败的原因
		this._value = undefined
		// 3. 存储 then 方法中传入的回调函数（用于处理异步情况）
		this._onFulfilledCallbacks = []
		this._onRejectedCallbacks = []

		// 4. 立即执行执行器函数 executor
		// 并传入 resolve 和 reject 函数
		try {
			executor(this._resolve.bind(this), this._reject.bind(this))
		} catch (error) {
			// 如果执行器同步抛出错误，则 promise 被拒绝
			this._reject(error)
		}
	}

	_resolve(value) {
		// 只有 pending 状态可以改变
		if (this._state !== 'pending') return

		// 处理 thenable 对象（即实现了 then 方法的对象或函数，例如另一个 Promise）
		// 这是 Promise 解析过程的核心，也是实现 Promise 链式调用的关键
		if (
			value instanceof MyPromise ||
			(value !== null &&
				typeof value === 'object' &&
				typeof value.then === 'function')
		) {
			// 如果 value 是一个 thenable，则采用它的状态
			// 这意味着我们的 Promise 将等待这个 thenable 的状态决定
			value.then(
				(val) => this._resolve(val), // 当 thenable 成功时，用它的值继续 resolve 当前 Promise
				(err) => this._reject(err) // 当 thenable 失败时，用它的原因 reject 当前 Promise
			)
			return
		}

		// 改变状态和值
		this._state = 'fulfilled'
		this._value = value

		// 执行所有之前通过 then 注册的 onFulfilled 回调
		this._onFulfilledCallbacks.forEach((callback) => callback())
		// 清空队列
		this._onFulfilledCallbacks = []
	}

	_reject(reason) {
		// 只有 pending 状态可以改变
		if (this._state !== 'pending') return

		this._state = 'rejected'
		this._value = reason

		// 执行所有之前通过 then 注册的 onRejected 回调
		this._onRejectedCallbacks.forEach((callback) => callback())
		// 清空队列
		this._onRejectedCallbacks = []
	}

	// then 方法
	then(onFulfilled, onRejected) {
		// 1. 返回一个新的 Promise
		return new MyPromise((resolve, reject) => {
			// 2. 封装一个处理函数，它负责执行回调并根据结果决定新 Promise 的状态
			const handleFulfilled = () => {
				// 使用 queueMicrotask 或 setTimeout 来模拟异步执行（规范要求）
				// 原生 Promise 使用的是微任务队列 (Microtask Queue)
				queueMicrotask(() => {
					try {
						// 如果 onFulfilled 不是函数，则“穿透”值
						if (typeof onFulfilled !== 'function') {
							resolve(this._value)
						} else {
							// 执行 onFulfilled 回调，并获取返回值 x
							const x = onFulfilled(this._value)
							// 根据返回值 x 来决定新 Promise 的状态 (Resolution Procedure)
							this._resolvePromise(resolve, reject, x)
						}
					} catch (error) {
						// 如果执行回调时抛出错误，则新 Promise 被拒绝
						reject(error)
					}
				})
			}

			const handleRejected = () => {
				queueMicrotask(() => {
					try {
						// 如果 onRejected 不是函数，则“穿透”原因
						if (typeof onRejected !== 'function') {
							reject(this._value)
						} else {
							// 执行 onRejected 回调，并获取返回值 x
							const x = onRejected(this._value)
							// 根据返回值 x 来决定新 Promise 的状态
							this._resolvePromise(resolve, reject, x)
						}
					} catch (error) {
						reject(error)
					}
				})
			}

			// 3. 根据当前 Promise 的状态，决定如何安排处理函数
			if (this._state === 'fulfilled') {
				// 如果当前 Promise 已经是成功状态，异步执行 handleFulfilled
				handleFulfilled()
			} else if (this._state === 'rejected') {
				// 如果当前 Promise 已经是失败状态，异步执行 handleRejected
				handleRejected()
			} else {
				// 如果当前 Promise 是 pending 状态，将处理函数存入队列
				this._onFulfilledCallbacks.push(handleFulfilled)
				this._onRejectedCallbacks.push(handleRejected)
			}
		})
	}

	// ！这是最复杂的部分：Promise 解决过程
	_resolvePromise(resolve, reject, x) {
		// 2.3.1: 如果 promise 和 x 指向同一对象，以 TypeError 为据因拒绝执行 promise（防止循环引用）
		if (x === this) {
			reject(new TypeError('Chaining cycle detected for promise'))
			return
		}

		// 2.3.2: 如果 x 为 Promise ，则使 promise 接受 x 的状态
		if (x instanceof MyPromise) {
			// 如果 x 处于等待态， promise 需保持为等待态直至 x 被执行或拒绝
			// 如果 x 处于执行态，用相同的值执行 promise
			// 如果 x 处于拒绝态，用相同的据因拒绝 promise
			x.then(
				(value) => this._resolvePromise(resolve, reject, value), // 递归解析，直到 x 是一个非 thenable 值
				reject
			)
			return
		}

		// 2.3.3: 如果 x 为对象或者函数
		if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
			let called = false // 防止 thenable 对象既调用 resolve 又调用 reject
			try {
				// 2.3.3.1: 把 x.then 赋值给 then
				const then = x.then
				// 2.3.3.3: 如果 then 是函数，就将 x 作为函数的作用域 this 调用之
				if (typeof then === 'function') {
					then.call(
						x,
						// 两个回调函数：resolvePromise 和 rejectPromise
						(y) => {
							// 2.3.3.3.3: 如果 resolvePromise 和 rejectPromise 均被调用，或者被同一参数调用了多次，则优先采用首次调用并忽略剩下的调用
							if (called) return
							called = true
							// 2.3.3.3.1: 如果 resolvePromise 以值 y 为参数被调用，则运行 [[Resolve]](promise, y)
							this._resolvePromise(resolve, reject, y)
						},
						(r) => {
							// 2.3.3.3.3
							if (called) return
							called = true
							// 2.3.3.3.2: 如果 rejectPromise 以据因 r 为参数被调用，则以据因 r 拒绝 promise
							reject(r)
						}
					)
				} else {
					// 2.3.3.4: 如果 then 不是函数，以 x 为参数执行 promise
					resolve(x)
				}
			} catch (error) {
				// 2.3.3.3.4: 如果调用 then 方法抛出了异常 e
				// 2.3.3.3.4.1: 如果 resolvePromise 或 rejectPromise 已经被调用，则忽略之
				if (called) return
				// 2.3.3.3.4.2: 否则以 e 为据因拒绝 promise
				reject(error)
			}
		} else {
			// 2.3.4: 如果 x 不为对象或者函数，以 x 为参数执行 promise
			resolve(x)
		}
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

console.log('promise.js')

module.exports = MyPromise
