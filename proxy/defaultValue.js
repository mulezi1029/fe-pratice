const createDefaultValueProxy = (target, defaults) => {
  return new Proxy(target, {
    get(target, prop, receiver) {
      if (!(prop in target) && prop in defaults) {
        return Reflect.get(defaults, prop);
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

// 使用示例
const defaults = { theme: 'light', language: 'zh-CN' };
const settings = createDefaultValueProxy({}, defaults);
console.log(settings.theme);  // 输出: 'light'
settings.theme = 'dark';
console.log(settings.theme);  // 输出: 'dark' 