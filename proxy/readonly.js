const createReadOnlyProxy = (target) => {
  return new Proxy(target, {
    set(target, prop, value, receiver) {
      throw new Error(`不能修改只读属性 ${prop}`);
    },
    deleteProperty(target, prop) {
      throw new Error(`不能删除只读属性 ${prop}`);
    }
  });
}

// 使用示例
const config = createReadOnlyProxy({
  apiUrl: 'https://api.example.com',
  timeout: 5000
});

try {
  config.apiUrl = 'new-url';  // 抛出错误：不能修改只读属性 apiUrl
} catch (e) {
  console.error(e.message);
} 