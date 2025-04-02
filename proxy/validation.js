const createValidationProxy = (target) => {
  const validators = {
    age: (value) => value >= 0 && value <= 100,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  };
  // 定义验证规则对象
  // age: 验证年龄是否在 0-100 之间
  // email: 验证邮箱格式是否正确

  return new Proxy(target, {
    set(target, prop, value, receiver) {
      if (validators[prop]) {
        if (!validators[prop](value)) {
          throw new Error(`${prop} 的值 ${value} 不合法`);
        }
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

// 使用示例
const user = createValidationProxy({});
user.age = 25;  // 正常
try {
  user.age = -1;  // 抛出错误：age 的值 -1 不合法
} catch (e) {
  console.error(e.message);
} 