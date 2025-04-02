const createPerformanceProxy = (target, name) => {
  const metrics = {
    calls: {},
    timing: {}
  };

  return new Proxy(target, {
    get(target, prop, receiver) {
      if (typeof target[prop] === 'function') {
        return new Proxy(target[prop], {
          apply(target, thisArg, args) {
            metrics.calls[prop] = (metrics.calls[prop] || 0) + 1;
            const start = performance.now();
            const result = Reflect.apply(target, thisArg, args);
            const end = performance.now();
            metrics.timing[prop] = (metrics.timing[prop] || 0) + (end - start);
            console.log(`[性能] ${name}.${prop} 调用次数: ${metrics.calls[prop]}, 总耗时: ${metrics.timing[prop].toFixed(2)}ms`);
            return result;
          }
        });
      }
      return Reflect.get(target, prop, receiver);
    }
  });
}

// 使用示例
const calculator = createPerformanceProxy({
  add: (a, b) => {
    const result = a + b;
    // 模拟耗时操作
    for(let i = 0; i < 1000000; i++) {}
    return result;
  }
}, 'calculator');

calculator.add(1, 2);
calculator.add(3, 4); 