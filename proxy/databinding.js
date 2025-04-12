/**
 * 创建一个数据绑定代理对象
 * 使用Proxy实现数据监听和响应式更新
 * @param {Object} target - 需要被代理的目标对象
 * @returns {Proxy} - 返回一个代理对象
 */
const createBindingProxy = (target) => {
  // 创建一个Map来存储监听器
  const listeners = new Map();
  // 将listeners添加到目标对象上，方便后续访问
  target.listeners = listeners;
  return new Proxy(target, {
    /**
     * set拦截器
     * 当设置属性值时触发，会通知所有监听该属性的监听器
     */
    set(target, prop, value, receiver) {
      // 获取旧值
      let oldValue = target[prop];
      // 使用Reflect.set设置新值
      const result = Reflect.set(target, prop, value, receiver);
      // 如果该属性有监听器，则通知所有监听器
      if (target.listeners.has(prop)) {
        target.listeners.get(prop).forEach(listener => 
          listener(value, oldValue));
      }
      return result;
    },

    /**
     * get拦截器
     * 当获取属性值时触发，确保返回的对象也是代理对象
     */
    get(target, prop, receiver) { 
      const value = Reflect.get(target, prop, receiver);
      // 如果是获取listeners属性，直接返回
      if(prop === 'listeners'){
        return listeners;
      }
      // 如果访问的属性的值仍是对象，则为该对象创建代理
      if (typeof value === 'object' && value !== null) {
        // 检查是否已经是代理对象
        // 1. 检查是否有listeners属性
        // 2. 检查对象是否已被代理过
        if (value.listeners && typeof value === 'object') {
          return value;
        }
          target[prop] = createBindingProxy(value);
        }
      console.log(`访问属性${prop}`)
      return value;
    }
  });
}

/**
 * 添加属性监听器的辅助方法，为指定的属性添加回调
 * @param {Object} obj - 要监听的对象
 * @param {string} prop - 要监听的属性名
 * @param {Function} callback - 属性变化时的回调函数
 */
const addListener = (obj, prop, callback) => {
  // 如果该属性还没有监听器集合，则创建一个新的Set
  if (!obj.listeners.has(prop)) {
    obj.listeners.set(prop, new Set());
  }
  // 将回调函数添加到监听器集合中
  obj.listeners.get(prop).add(callback);
};

// 如果在Node.js环境中，导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createBindingProxy,
    addListener
  };
}

// 使用示例：为 data 创建 proxy 代理,并创建一个 listener 对象，用于存储 data 对象下直接属性的监听器
// 只在浏览器环境或直接执行时运行示例代码
if (typeof window !== 'undefined' || (typeof require === 'undefined')) {
  const data = createBindingProxy({
    message: 'Hello',
    user: {
      name: 'John',
      age: 30,
      address: {
        city: 'New York',
        street: 'Main St'
      }
    }
  });

  // 添加各种属性的监听器
  addListener(data, 'message', (newValue, oldValue) => {
    console.log(`cb1:message 从 "${oldValue}" 变更为 "${newValue}"`);
  }); // data 对象的 message 属性添加日志监听器

  addListener(data,'message',(newValue,oldValue)=>{
    console.log(`cb2:message 从 "${oldValue}" 变更为 "${newValue}"`);
  })

  addListener(data.user, 'name', (newValue, oldValue) => {
    console.log(`user.name 从 "${oldValue}" 变更为 "${newValue}"`);
  });  // 此处会触发 data.user 属性的访问

  addListener(data.user, 'age', (newValue, oldValue) => {
    console.log(`user.age 从 "${oldValue}" 变更为 "${newValue}"`);
  });

  addListener(data.user.address, 'city', (newValue, oldValue) => {
    console.log(`user.address.city 从 "${oldValue}" 变更为 "${newValue}"`);
  });

  addListener(data.user.address, 'street', (newValue, oldValue) => {
    console.log(`user.address.street 从 "${oldValue}" 变更为 "${newValue}"`);
  });

  // 测试数据变更
  data.message = 'Hello World';  // 输出: message 从 "Hello" 变更为 "Hello World" 
  data.user.name = 'Jane';  // 输出: user.name 从 "John" 变更为 "Jane"
  data.user.age = 31;  // 输出: user.age 从 30 变更为 31
  data.user.address.city = 'Los Angeles';  // 输出: user.address.city 从 "New York" 变更为 "Los Angeles"
}