# 代码编写规范规则

## 函数编写规范

### 1. 函数命名规范
- 使用动词+名词的命名方式，清晰表达函数功能
- 采用小驼峰命名法（camelCase）
- 避免使用缩写，除非是广泛认可的缩写
- 函数名应准确描述其功能，避免模糊命名

### 2. 函数参数规范
- 参数数量控制在5个以内，过多应考虑使用对象参数
- 参数应有明确的类型说明（通过JSDoc或TypeScript）
- 可选参数应放在必选参数之后
- 参数应有合理的默认值设置

### 3. 函数返回值规范
- 函数应有明确的返回值类型
- 避免返回undefined，应明确返回null或特定值
- 异步函数应返回Promise对象
- 错误处理应通过throw抛出异常，而不是返回错误码

### 4. 函数复杂度控制
- 单个函数行数控制在80行以内
- 避免过深的嵌套层级（建议不超过3层）
- 单一职责原则：一个函数只做一件事
- 复杂逻辑应拆分为多个小函数

### 5. 注释规范
- 公共函数必须使用JSDoc格式注释
- 注释应说明函数功能、参数、返回值
- 复杂算法应有详细的实现说明
- 避免无意义的注释，注释应提供有价值的信息

### 6. 错误处理规范
- 使用try-catch处理可能出现的异常
- 错误信息应具体明确，便于调试
- 避免静默吞掉异常，除非有明确理由
- 异步操作应正确处理Promise rejection

### 7. 提前返回模式与卫语句规范
- 优先使用卫语句（Guard Clauses）进行前置条件检查
- 尽早返回无效或边界情况，减少嵌套层级
- 使用if-return模式替代if-else嵌套
- 卫语句应放在函数开头，处理异常情况
- 避免深层嵌套，提高代码可读性

### 8. 代码风格规范
- 使用一致的缩进（2或4个空格）
- 大括号使用一致的风格
- 避免过长的代码行（建议不超过80字符）
- 使用有意义的变量名

## 示例代码

```javascript
/**
 * 计算两个数字的和（使用卫语句）
 * @param {number} a - 第一个数字
 * @param {number} b - 第二个数字
 * @returns {number} 两个数字的和
 * @throws {Error} 当参数不是数字时抛出错误
 */
function calculateSum(a, b) {
  // 卫语句：前置条件检查
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('参数必须是数字');
  }
  
  // 提前返回边界情况
  if (a === 0) return b;
  if (b === 0) return a;
  
  // 主逻辑
  return a + b;
}

/**
 * 用户权限验证（提前返回模式示例）
 * @param {Object} user - 用户对象
 * @param {string} permission - 所需权限
 * @returns {boolean} 是否有权限
 */
function hasPermission(user, permission) {
  // 卫语句：检查用户是否存在
  if (!user) return false;
  
  // 卫语句：检查用户是否激活
  if (!user.isActive) return false;
  
  // 卫语句：检查权限列表
  if (!user.permissions) return false;
  
  // 主逻辑
  return user.permissions.includes(permission);
}

/**
 * 异步获取用户数据
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 用户数据
 */
async function fetchUserData(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('获取用户数据失败:', error);
    throw error;
  }
}
```

## 最佳实践

1. **保持函数纯净**：避免副作用，相同的输入应产生相同的输出
2. **函数复用性**：设计可复用的函数，避免重复代码
3. **测试友好**：函数应易于测试，避免隐藏的依赖
4. **性能考虑**：避免在循环中创建函数，注意内存使用
5. **可读性优先**：代码应易于理解和维护
6. **提前返回**：使用卫语句减少嵌套，提高代码清晰度

遵循这些规范将有助于编写出高质量、可维护的代码。