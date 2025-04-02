const createBindingProxy = (target) => {
  const listeners = new Map();

  return new Proxy(target, {
    set(target, prop, value, receiver) {
      const oldValue = target[prop];
      const result = Reflect.set(target, prop, value, receiver);
      
      if (listeners.has(prop)) {
        listeners.get(prop).forEach(listener => 
          listener(value, oldValue));
      }
      return result;
    }
  });
}

// 添加监听器的辅助方法
const addListener = (obj, prop, callback) => {
  if (!listeners.has(prop)) {
    listeners.set(prop, new Set());
  }
  listeners.get(prop).add(callback);
};

// 使用示例
const data = createBindingProxy({
  message: 'Hello'
});

addListener(data, 'message', (newValue, oldValue) => {
  console.log(`message 从 "${oldValue}" 变更为 "${newValue}"`);
});

data.message = 'Hello World';  // 输出: message 从 "Hello" 变更为 "Hello World" 