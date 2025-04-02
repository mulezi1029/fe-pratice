const createBindingProxy = (target) => {
  const listeners = new Map();
  target.listeners = listeners;
  return new Proxy(target, {
    set(target, prop, value, receiver) {
      let oldValue = target[prop];
      if(typeof oldValue === 'object' && oldValue !== null){
        oldValue = createBindingProxy(oldValue);
      }
      const result = Reflect.set(target, prop, value, receiver);
      
      if (target.listeners.has(prop)) {
        target.listeners.get(prop).forEach(listener => 
          listener(value, oldValue));
      }
      return result;
    },
    get(target, prop, receiver) { 
      const value = Reflect.get(target, prop, receiver);
      if(prop === 'listeners'){
        return listeners;
      }
      if (typeof value === 'object' && value !== null) {
        // 判断是否已经是代理对象
        // 1. 检查是否有listeners属性
        // 2. 检查是否是Proxy实例
        if (value.listeners && typeof value === 'object' && 'listeners' in value) {
          return value;
        }
        target[prop] = createBindingProxy(value);
      }
      return value;
    }
  });
}

// 添加监听器的辅助方法
const addListener = (obj, prop, callback) => {
  if (!obj.listeners.has(prop)) {
    obj.listeners.set(prop, new Set());
  }
  obj.listeners.get(prop).add(callback);
};

// 使用示例
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

addListener(data, 'message', (newValue, oldValue) => {
  console.log(`message 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user, 'name', (newValue, oldValue) => {
  console.log(`user.name 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user, 'age', (newValue, oldValue) => {
  console.log(`user.age 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user.address, 'city', (newValue, oldValue) => {
  console.log(`user.address.city 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user.address, 'street', (newValue, oldValue) => {
  console.log(`user.address.street 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user.address, 'city', (newValue, oldValue) => {
  console.log(`user.address.city 从 "${oldValue}" 变更为 "${newValue}"`);
});

addListener(data.user.address, 'street', (newValue, oldValue) => {
  console.log(`user.address.street 从 "${oldValue}" 变更为 "${newValue}"`);
});

data.message = 'Hello World';  // 输出: message 从 "Hello" 变更为 "Hello World" 
data.user.name = 'Jane';  // 输出: user.name 从 "John" 变更为 "Jane"
data.user.age = 31;  // 输出: user.age 从 30 变更为 31
data.user.address.city = 'Los Angeles';  // 输出: user.address.city 从 "New York" 变更为 "Los Angeles"