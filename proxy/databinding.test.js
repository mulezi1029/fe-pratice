/**
 * databinding.js 的测试用例
 * 测试数据绑定代理系统的各种功能和边缘情况
 */

// 导入需要测试的函数
const { createBindingProxy, addListener } = require('./databinding');

// 测试辅助函数：创建一个模拟的回调函数
function createMockCallback() {
  const calls = [];
  const callback = (newValue, oldValue) => {
    calls.push({ newValue, oldValue });
  };
  callback.getCalls = () => calls;
  callback.getLastCall = () => calls[calls.length - 1];
  callback.reset = () => calls.splice(0, calls.length);
  return callback;
}

// 测试套件
console.log('----------- 开始测试数据绑定系统 -----------');

// 测试1：基本属性监听
console.log('\n测试1：基本属性监听');
(() => {
  // 设置测试数据
  const data = createBindingProxy({ message: 'Hello' });
  const callback = createMockCallback();
  
  // 添加监听器
  addListener(data, 'message', callback);
  
  // 修改属性并验证回调是否被调用
  data.message = 'Hello World';
  const call = callback.getLastCall();
  
  // 验证结果
  console.log('回调函数应被调用:', call !== undefined);
  console.log('新值应为 "Hello World":', call && call.newValue === 'Hello World');
  console.log('旧值应为 "Hello":', call && call.oldValue === 'Hello');
})();

// 测试2：嵌套对象属性监听
console.log('\n测试2：嵌套对象属性监听');
(() => {
  // 设置嵌套测试数据
  const data = createBindingProxy({
    user: {
      name: 'John',
      profile: {
        age: 30
      }
    }
  });
  
  const nameCallback = createMockCallback();
  const ageCallback = createMockCallback();
  
  // 添加监听器到嵌套属性
  addListener(data.user, 'name', nameCallback);
  addListener(data.user.profile, 'age', ageCallback);
  
  // 修改属性并验证回调
  data.user.name = 'Jane';
  data.user.profile.age = 31;
  
  // 验证结果
  const nameCall = nameCallback.getLastCall();
  const ageCall = ageCallback.getLastCall();
  
  console.log('name回调应被调用:', nameCall !== undefined);
  console.log('新name值应为 "Jane":', nameCall && nameCall.newValue === 'Jane');
  console.log('旧name值应为 "John":', nameCall && nameCall.oldValue === 'John');
  
  console.log('age回调应被调用:', ageCall !== undefined);
  console.log('新age值应为 31:', ageCall && ageCall.newValue === 31);
  console.log('旧age值应为 30:', ageCall && ageCall.oldValue === 30);
})();

// 测试3：多个监听器
console.log('\n测试3：多个监听器');
(() => {
  const data = createBindingProxy({ count: 0 });
  const callback1 = createMockCallback();
  const callback2 = createMockCallback();
  
  // 添加多个监听器到同一属性
  addListener(data, 'count', callback1);
  addListener(data, 'count', callback2);
  
  // 修改属性
  data.count = 1;
  
  // 验证结果
  console.log('回调1应被调用:', callback1.getCalls().length === 1);
  console.log('回调2应被调用:', callback2.getCalls().length === 1);
})();

// 测试4：添加新属性
console.log('\n测试4：添加新属性');
(() => {
  const data = createBindingProxy({});
  const callback = createMockCallback();
  
  // 先添加监听器，再添加属性
  addListener(data, 'newProp', callback);
  data.newProp = 'new value';
  
  // 验证结果
  const call = callback.getLastCall();
  console.log('回调应被调用:', call !== undefined);
  console.log('新值应为 "new value":', call && call.newValue === 'new value');
  console.log('旧值应为 undefined:', call && call.oldValue === undefined);
})();

// 测试5：动态添加嵌套对象
console.log('\n测试5：动态添加嵌套对象');
(() => {
  const data = createBindingProxy({});
  
  // 动态添加嵌套对象
  data.nested = { prop: 'value' };
  
  // 检查是否自动代理
  const nestedCallback = createMockCallback();
  addListener(data.nested, 'prop', nestedCallback);
  
  // 修改动态添加的嵌套对象的属性
  data.nested.prop = 'new value';
  
  // 验证结果
  const call = nestedCallback.getLastCall();
  console.log('嵌套对象应被自动代理:', data.nested.listeners !== undefined);
  console.log('嵌套属性回调应被调用:', call !== undefined);
  console.log('新值应为 "new value":', call && call.newValue === 'new value');
})();

// 测试6：数组监听
console.log('\n测试6：数组监听');
(() => {
  const data = createBindingProxy({ list: [1, 2, 3] });
  const callback = createMockCallback();
  
  // 监听整个数组
  addListener(data, 'list', callback);
  
  // 修改数组
  data.list = [4, 5, 6];
  
  // 验证结果
  const call = callback.getLastCall();
  console.log('数组修改回调应被调用:', call !== undefined);
  console.log('新数组应为 [4,5,6]:', call && JSON.stringify(call.newValue) === JSON.stringify([4, 5, 6]));
})();

// 测试7：监听数组元素
console.log('\n测试7：监听数组元素');
(() => {
  const data = createBindingProxy({ list: [1, 2, 3] });
  const callback = createMockCallback();
  
  // 监听数组索引
  addListener(data.list, '0', callback);
  
  // 修改数组元素
  data.list[0] = 10;
  
  // 验证结果
  const call = callback.getLastCall();
  console.log('数组元素回调应被调用:', call !== undefined);
  console.log('新值应为 10:', call && call.newValue === 10);
  console.log('旧值应为 1:', call && call.oldValue === 1);
})();

// 测试8：边缘情况 - 非对象值
console.log('\n测试8：边缘情况 - 非对象值');
(() => {
  const data = createBindingProxy({ 
    num: 42, 
    str: 'text', 
    bool: true, 
    nil: null 
  });
  
  console.log('访问原始类型属性不应出错:');
  try {
    console.log(`- 数字: ${data.num}`);
    console.log(`- 字符串: ${data.str}`);
    console.log(`- 布尔值: ${data.bool}`);
    console.log(`- null: ${data.nil}`);
    console.log('通过✓');
  } catch (err) {
    console.error('发生错误:', err);
  }
})();

// 测试9：移除监听器
console.log('\n测试9：移除监听器 (手动实现)');
(() => {
  const data = createBindingProxy({ counter: 0 });
  const callback = createMockCallback();
  
  // 添加监听器
  addListener(data, 'counter', callback);
  
  // 第一次修改
  data.counter = 1;
  console.log('第一次修改后回调次数:', callback.getCalls().length);
  
  // 手动移除监听器
  const listeners = data.listeners.get('counter');
  listeners.delete(callback);
  
  // 第二次修改
  data.counter = 2;
  console.log('移除监听器后回调次数仍应为1:', callback.getCalls().length === 1);
})();

console.log('\n----------- 测试完成 -----------'); 