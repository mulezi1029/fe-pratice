const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'
class MyPromise {
	#state = PENDING
	#value = undefined
	#handlers = []

	#setState(state, value) {
		if (this.#state !== PENDING) return
		this.#state = state
		this.#value = value
		this.#runThenHandlers()
	}

	#runMicroTask = (fn) => {
		if (typeof queueMicrotask === 'function') {
			queueMicrotask(fn)
		} else if (
			typeof process === 'object' &&
			typeof process.nextTick === 'function'
		) {
			process.nextTick(fn)
		} else if (typeof MutationObserver === 'function') {
			const observer = new MutationObserver(fn)
			const node = document.createTextNode('')
			observer.observe(node, { characterData: true })
			node.data = '1'
		} else {
			setTimeout(fn)
		}
	}

	#runThenHandlers() {
		this.#runMicroTask(() => {
			this.#handlers.forEach((handler) => handler())
			this.#handlers = []
		})
	}

	#isPromiseLike(obj) {
		return (
			obj !== null &&
			(typeof obj === 'object' || typeof obj === 'function') &&
			typeof obj.then === 'function'
		)
	}

	then(onFulfilled, onRejected) {
		return new MyPromise((resolve, reject) => {
			this.#handlers.push(() => {
				try {
					const cb = this.#state === FULFILLED ? onFulfilled : onRejected
					const res = typeof cb === 'function' ? cb(this.#value) : this.#value
					if (this.#isPromiseLike(res)) {
						res.then(resolve, reject)
					} else {
						resolve(res)
					}
				} catch (error) {
					reject(error)
				}
			})
			if (this.#state !== PENDING) {
				this.#runThenHandlers()
			}
		})
	}

	constructor(executor) {
		const resolve = (value) => {
			if (this.#state !== PENDING) return
			this.#setState(FULFILLED, value)
		}
		const reject = (reason) => {
			if (this.#state !== PENDING) return
			this.#setState(REJECTED, reason)
		}

		try {
			executor(resolve, reject)
		} catch (error) {
			reject(error)
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

const p = new MyPromise((resolve, reject) => {
	resolve(123)
})

p.then(
	(res) => {
		console.log('then1 res', res)
		return new Promise((resolve, reject) => {
			reject(res * 2)
		})
	},
	(err) => {
		console.log('then1 err', err)
	}
).then((res) => {
	console.log('then2 res', res)
}, (err) => {
	console.log('then2 err', err)
})

console.log('end')

module.exports = MyPromise
