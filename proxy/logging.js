const createLoggingProxy = (target, name) => {
  return new Proxy(target, {
    get(target, prop, receiver) {
      let value = Reflect.get(target, prop, receiver);
      console.log(`[访问日志] 正在访问 ${name} 的 ${prop} 属性, 值为 ${value}`);
      return value;
    },
    set(target, prop, value, receiver) {
      console.log(`[修改日志] 正在设置 ${name} 的 ${prop} 属性为 ${value}`);
      let result = Reflect.set(target, prop, value, receiver);
      console.log(`[修改日志] 设置 ${name} 的 ${prop} 属性为 ${value} 的结果为 ${result}`);
      return result;
    }
  });
}

// 使用示例
const user = createLoggingProxy({ name: '张三', age: 25 }, 'user');
user.name;  // 输出: [访问日志] 正在访问 user 的 name 属性
user.age = 26;  // 输出: [修改日志] 正在设置 user 的 age 属性为 26 
user.age;  // 输出: [访问日志] 正在访问 user 的 age 属性, 值为 26