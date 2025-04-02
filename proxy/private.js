const createPrivateProxy = (target) => {
  return new Proxy(target, {
    get(target, prop, receiver) {
      if (prop.startsWith('_')) {
        throw new Error(`不能访问私有属性 ${prop}`);
      }
      return Reflect.get(target, prop, receiver);
    },
    set(target, prop, value, receiver) {
      if (prop.startsWith('_')) {
        throw new Error(`不能修改私有属性 ${prop}`);
      }
      return Reflect.set(target, prop, value, receiver);
    }
  });
}

// 使用示例
const user = createPrivateProxy({
  name: '张三',
  _password: '123456'
});

console.log(user.name);  // 输出: '张三'
try {
  console.log(user._password);  // 抛出错误：不能访问私有属性 _password
} catch (e) {
  console.error(e.message);
} 