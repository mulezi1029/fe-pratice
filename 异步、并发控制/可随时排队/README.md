# 可随时排队的并发池控制方案

## 🎯 项目概述

这是一个全新的并发控制方案，从传统的"批量处理模式"升级为"服务模式"，支持动态添加任务的并发池控制。

### 💡 核心理念

**传统方案**：一次性提交所有任务 → 批量处理 → 等待全部完成  
**新方案**：持续运行的服务 → 随时添加任务 → 实时调度执行

## 🚀 核心特性

- ✅ **动态任务添加** - 随时可以添加新任务，无需预先收集
- ✅ **多种调度策略** - FIFO、LPT、SPT、PRIORITY、WEIGHTED
- ✅ **实时状态监控** - 随时查询池状态和任务进度
- ✅ **灵活生命周期** - 暂停、恢复、取消、销毁
- ✅ **事件驱动架构** - 丰富的事件通知机制
- ✅ **完整错误处理** - 优雅的异常处理和恢复

## 📋 文件结构

```
可随时排队/
├── DynamicConcurrencyPool.js  # 核心并发池类
├── TaskWrapper.js             # 任务包装器
├── ScheduleStrategy.js        # 调度策略
├── util.js                   # 工具函数
├── demo_basic.js             # 基础演示
├── demo_comparison.js        # 对比测试  
├── index.js                  # 主入口文件
└── README.md                 # 项目说明
```

## ⚡ 快速开始

### 基本用法

```javascript
const DynamicConcurrencyPool = require('./DynamicConcurrencyPool');

// 创建并发池
const pool = new DynamicConcurrencyPool(3, 'FIFO');

// 随时添加任务
const task1 = pool.addTask(async () => {
    // 你的异步任务
    await someAsyncOperation();
    return 'result';
}, { 
    expectedDuration: 1000,
    priority: 5,
    name: 'MyTask' 
});

// 等待结果
const result = await task1;
console.log('任务结果:', result);

// 清理资源
await pool.destroy();
```

### 运行演示

```bash
# 交互式演示（推荐）
node index.js

# 自动运行所有演示
node index.js --auto

# 运行特定演示
node demo_basic.js        # 基础功能演示
node demo_comparison.js   # 性能对比测试
```

## 🏗️ 架构设计

### 核心组件

1. **DynamicConcurrencyPool** - 主要的并发池控制器
2. **TaskWrapper** - 任务状态管理和生命周期控制  
3. **ScheduleStrategy** - 可插拔的调度策略系统
4. **EventEmitter** - 事件通知机制

### 调度策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| FIFO | 先进先出 | 公平调度，保持提交顺序 |
| LPT | 长任务优先 | 最大化并行效率 |
| SPT | 短任务优先 | 最小化平均等待时间 |
| PRIORITY | 优先级调度 | 有明确优先级需求 |
| WEIGHTED | 加权调度 | 综合考虑多个因素 |

## 📊 性能对比

### 与传统批量模式对比

| 特性 | 传统批量模式 | 动态并发池 |
|------|-------------|-----------|
| 任务提交 | 一次性批量 | 随时动态添加 |
| 池生命周期 | 与任务批次绑定 | 持久化服务 |
| 状态查询 | 不支持 | 实时状态监控 |
| 任务取消 | 不支持 | 支持取消等待任务 |
| 事件通知 | 无 | 丰富的事件系统 |
| 适用场景 | 批处理 | 实时服务 |

### 性能测试结果

基于相同的10个测试任务，在最大并发数为3的条件下：

- **传统FIFO**: 11413ms
- **传统LPT**: 10004ms  
- **动态池(批量模式)**: ~10000ms
- **动态池(真实模式)**: 根据任务到达间隔变化

## 🎯 使用场景

### ✅ 适合的场景

- **Web服务器** - 处理用户请求
- **文件处理** - 上传、下载、转换
- **数据管道** - 实时数据处理
- **任务调度** - 后台任务系统
- **API网关** - 微服务调用

### ❌ 不适合的场景

- **已知任务集合的批处理** - 传统模式更简单
- **对内存敏感的场景** - 动态池有额外开销
- **简单的顺序处理** - 无需并发控制

## 🔧 高级用法

### 自定义调度策略

```javascript
class CustomStrategy extends ScheduleStrategy {
    sort(tasks) {
        // 实现你的排序逻辑
        return tasks.sort((a, b) => /* your logic */);
    }
    
    getName() {
        return 'CUSTOM';
    }
}

const pool = new DynamicConcurrencyPool(3, new CustomStrategy());
```

### 事件监听

```javascript
pool.on('taskAdded', (task) => {
    console.log('任务已添加:', task.fnName);
});

pool.on('taskComplete', (task, status) => {
    console.log('任务完成:', task.fnName, status);
});

pool.on('idle', () => {
    console.log('池子空闲');
});
```

### 实时监控

```javascript
// 状态监控
const status = pool.getStatus();
console.log('当前状态:', status);

// 性能指标
console.log('等待任务数:', pool.getPendingCount());
console.log('执行任务数:', pool.getRunningCount());
console.log('可用槽位:', pool.getAvailableSlots());
```

## 🧪 测试和验证

项目包含完整的演示和测试：

1. **基础功能演示** - 展示动态添加任务的能力
2. **交互式演示** - 模拟多用户同时提交任务
3. **状态监控演示** - 实时状态变化展示
4. **性能对比测试** - 与传统模式的性能对比
5. **功能特性对比** - 详细特性差异对比
6. **真实场景模拟** - Web服务器场景模拟

## 🤝 贡献和反馈

这是一个教学和演示项目，展示了并发控制的进化思路：

- 从"批量工具"到"并发服务"
- 从"静态调度"到"动态调度"  
- 从"简单控制"到"丰富生态"

## 📝 总结

### 何时选择传统批量模式？
- 任务集合预先确定
- 简单的批处理场景
- 对性能要求极致
- 代码简洁性优先

### 何时选择动态并发池？
- 任务动态到达
- 需要实时响应
- 服务型应用
- 需要复杂的调度策略
- 需要状态监控和控制

动态并发池将并发控制从"工具"升级为"服务"，为现代异步应用提供了更强大、更灵活的解决方案。 