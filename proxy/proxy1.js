  // proxy1.js
// 介绍 Proxy 的各种用法

// 1. 数据绑定
const data = { name: 'John', age: 30 };
const dataProxy = new Proxy(data, {
  set(target, key, value) {
    console.log(`Setting ${key} to ${value}`);
    target[key] = value;
    return true;
  }
});

dataProxy.name = 'Jane'; // 输出: Setting name to Jane

// 2. 验证
const validationProxy = new Proxy(data, {
  set(target, key, value) {
    if (key === 'age' && typeof value !== 'number') {
      throw new TypeError('Age must be a number');
    }
    target[key] = value;
    return true;
  }
});

try {
  validationProxy.age = 'thirty'; // 抛出错误: Age must be a number
} catch (e) {
  console.error(e.message);
}

// 3. 日志记录
const loggingProxy = new Proxy(data, {
  get(target, key) {
    console.log(`Getting ${key}`);
    return target[key];
  },
  set(target, key, value) {
    console.log(`Setting ${key} to ${value}`);
    target[key] = value;
    return true;
  }
});

console.log(loggingProxy.name); // 输出: Getting name, Jane
loggingProxy.age = 31; // 输出: Setting age to 31

// 4. 默认值
const defaults = { name: 'Unknown', age: 0 };
const defaultValueProxy = new Proxy({}, {
  get(target, key) {
    return target[key] || defaults[key];
  }
});

console.log(defaultValueProxy.name); // 输出: Unknown
console.log(defaultValueProxy.age); // 输出: 0

// 5. 私有属性
const privateData = new WeakMap();
const privateProxy = new Proxy({}, {
  get(target, key) {
    if (key.startsWith('_')) {
      return privateData.get(target)[key];
    }
    return target[key];
  },
  set(target, key, value) {
    if (key.startsWith('_')) {
      if (!privateData.has(target)) {
        privateData.set(target, {});
      }
      privateData.get(target)[key] = value;
    } else {
      target[key] = value;
    }
    return true;
  }
});

privateProxy._secret = 'confidential';
console.log(privateProxy._secret); // 输出: confidential

// 6. 只读属性
const readOnlyProxy = new Proxy(data, {
  set(target, key, value) {
    if (key === 'name') {
      throw new TypeError('Name is read-only');
    }
    target[key] = value;
    return true;
  }
});

try {
  readOnlyProxy.name = 'Alice'; // 抛出错误: Name is read-only
} catch (e) {
  console.error(e.message);
}

// 7. 性能监控
const performanceProxy = new Proxy(data, {
  get(target, key) {
    console.time(`get ${key}`);
    const result = target[key];
    console.timeEnd(`get ${key}`);
    return result;
  },
  set(target, key, value) {
    console.time(`set ${key}`);
    target[key] = value;
    console.timeEnd(`set ${key}`);
    return true;
  }
});

console.log(performanceProxy.age); // 输出: 31, 并记录时间
performanceProxy.age = 32; // 输出: 并记录时间 