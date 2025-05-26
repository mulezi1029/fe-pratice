// 记录Promise的三种状态
// 1. pending：初始状态，既不是成功，也不是失败。
// 2. fulfilled：表示操作成功。
// 3. rejected：表示操作失败。
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

/**
 * 自定义Promise实现:
 * 1. Promise 接受一个执行器函数为参数，该执行器函数会立即执行，并接受两个函数作为参数：resolve 和 reject。
 *    resolve 与 reject 是 Promise 内部实现的两个函数，用于改变 Promise 的状态。其中，resolve 用于将 
 *    Promise 的状态从pending 改为 fulfilled，reject 用于将 Promise 的状态从 pending 改为 rejected。
 *    resolve 与 reject 都接受一个参数，resolve 的参数表示 Promise 成功的结果，reject 的参数表示 Promise
 *    失败的原因。
 * 2. Promise的状态有三种：pending、fulfilled、rejected。Promise的状态只能从pending变为fulfilled 或
 *    rejected。Promise的结果只能被设置一次。
 * 3. exexutor 函数执行过程中，如果出现错误或者抛出异常，则需要调用 reject 函数来改变 Promise 的状态为 
 *    reject。
 * 
 */
class MyPromise{
  // 声明私有字段
  #onFulfilledCallbacks = [];
  #onRejectedCallbacks = [];

  /**
   * 创建一个Promise
   * @param {Function} 任务执行器，立即执行 
   */
  constructor(executor) { 
    this.state = PENDING; // Promise的状态
    this.value = undefined; // Promise的结果
    this.#onFulfilledCallbacks = []; // 成功的回调函数
    this.#onRejectedCallbacks = []; // 失败的回调函数
    try {
      // 执行器函数，传入resolve和reject函数
      // 这里的this指向MyPromise实例。通过bind绑定this，确保在executor中this指向MyPromise实例
      executor(this.#resolve.bind(this), this.#reject.bind(this));
    }
    catch (error) {
      // 如果执行器函数抛出异常，则调用reject函数来改变 Promise 的状态为 reject。
      this.#reject(error);
    }
  }


  /**
   * 更改Promise的状态函数
   * @param {FULFILLED|REJECTED} newState 新状态
   * @param {any} data 相关数据
   */
  #changeState(newState, data) { 
    // 如果状态已经改变，则不再执行。状态只能改变一次。
    if (this.state !== PENDING) { 
      return;
    }
    this.state = newState;
    this.value = data;
  }


  /**
   * 标记Promise为完成
   * @param {String} status Promise的状态
   * @param {any} data 任务完成 Promise的结果
   */
  #resolve(data) {
    // 保存Promise的结果与修改状态
    this.#changeState(FULFILLED, data);
  }

  /**
   * 标记Promise为失败
   * @param {any} reason Promise的失败原因
   */
  #reject(reason) {
    // 保存Promise的结果与修改状态
    this.#changeState(REJECTED, reason);
  }

  /**
   * promise的then方法,接受两个参数：onFullfilled和onRejected。
   * onFullfilled是Promise成功时的回调函数，onRejected是Promise失败时的回调函数。
   * onFullfilled 与 onRejected 函数的执行时机：放入到微任务队列中，等待事件循环执行。
   *    1. 如果Promise的状态是pending，则将onFullfilled和onRejected函数添加到成功和失败的回调函数数组中。
   *    2. 如果Promise的状态是fulfilled，则调用onFullfilled函数，并将Promise的结果作为参数传入。
   *    3. 如果Promise的状态是rejected，则调用onRejected函数，并将Promise的失败原因作为参数传入。
   * then方法返回一个新的Promise对象。
   * 如果Promise的状态是fulfilled，则调用onFullfilled函数，并将Promise的结果作为参数传入。
   * 如果Promise的状态是rejected，则调用onRejected函数，并将Promise的失败原因作为参数传入。
   * 如果onFullfilled或onRejected函数返回一个Promise对象，则then方法返回这个Promise对象。
   * 如果onFullfilled或onRejected函数返回一个非Promise对象，则then方法返回一个新的Promise对象，
   * @param {Function} onFullfilled 
   * @param {Function} onRejected 
   */
  then(onFullfilled, onRejected) {
    // 如果onFullfilled不是函数，则将其设置为一个空函数
    if (typeof onFullfilled !== 'function') {
      onFullfilled = () => { }
    }
    // 如果onRejected不是函数，则将其设置为一个空函数
    if (typeof onRejected !== 'function') {
      onRejected = () => { }
    }
  
    // 注册then方法的回调函数
    this.#onFulfilledCallbacks.push((onFullfilled.bind(this, this.value)));
    this.#onRejectedCallbacks.push((onRejected.bind(this, this.value)));
    
    return new MyPromise((resolve, reject) => { 
      
    })
  }
}

function runMicroTask(cb) {
  if(typeof process !== 'undefined' && process.nextTick) {
    // Node.js环境
    debugger
    process.nextTick(cb);
  }
  else if (MutationObserver) {
    // 浏览器环境
    const observer = new MutationObserver(cb);
    const textNode = document.createTextNode('');
    observer.observe(textNode, { characterData: true });
    textNode.data = '1'; // 触发回调
  } else {
    // 其他环境
    setTimeout(cb, 0);
  }
}

const pro = new MyPromise((resolve, reject) => { 

})
console.log(pro)
pro.then(
  (data) => {
    console.log('then 成功回调', data);
  },
  (error) => {
    console.log('then 失败回调', error);
  }
);
pro.then((data) => {
  console.log(11, data)
});
console.log(1);