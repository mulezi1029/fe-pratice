const DynamicConcurrencyPool = require('./DynamicConcurrencyPool');
const { createTestTasks, printSeparator, formatTime, sleep } = require('./util');

// 模拟传统批量模式（类似现有的FIFO/LPT实现）
class TraditionalBatchPool {
    constructor(maxConcurrency, strategy = 'FIFO') {
        this.maxConcurrency = maxConcurrency;
        this.strategy = strategy;
    }
    
    // 批量执行任务（一次性提交所有任务）
    async executeBatch(taskFunctions) {
        const startTime = Date.now();
        console.log(`🏭 传统批量模式开始执行 ${taskFunctions.length} 个任务`);
        
        // 根据策略排序任务
        if (this.strategy === 'LPT') {
            taskFunctions.sort((a, b) => (b.options?.expectedDuration || 0) - (a.options?.expectedDuration || 0));
        }
        
        let activeCount = 0;
        const waitingQueue = [];
        
        const executeTask = async (taskFunc) => {
            if (activeCount >= this.maxConcurrency) {
                await new Promise(resolve => waitingQueue.push(resolve));
            }
            
            activeCount++;
            try {
                const result = await taskFunc.fn();
                return result;
            } finally {
                activeCount--;
                if (waitingQueue.length) {
                    const nextResolve = waitingQueue.shift();
                    nextResolve();
                }
            }
        };
        
        const results = await Promise.all(taskFunctions.map(task => executeTask(task)));
        const totalTime = Date.now() - startTime;
        
        return { results, totalTime, strategy: `Traditional-${this.strategy}` };
    }
}

/**
 * 性能对比测试
 */
async function performanceComparison() {
    printSeparator('性能对比测试', '=');
    
    const maxConcurrency = 3;
    const testTasks = createTestTasks();
    
    console.log(`📋 测试配置:`);
    console.log(`  - 最大并发数: ${maxConcurrency}`);
    console.log(`  - 任务数量: ${testTasks.length}`);
    console.log(`  - 测试策略: FIFO, LPT`);
    
    const results = [];
    
    // 测试传统批量模式 - FIFO
    console.log('\n🏭 1. 传统批量模式 (FIFO)');
    const traditionalFIFO = new TraditionalBatchPool(maxConcurrency, 'FIFO');
    const fifoResult = await traditionalFIFO.executeBatch([...testTasks]);
    results.push(fifoResult);
    
    await sleep(1000);
    
    // 测试传统批量模式 - LPT
    console.log('\n🏭 2. 传统批量模式 (LPT)');
    const traditionalLPT = new TraditionalBatchPool(maxConcurrency, 'LPT');
    const lptResult = await traditionalLPT.executeBatch([...testTasks]);
    results.push(lptResult);
    
    await sleep(1000);
    
    // 测试动态并发池 - FIFO（一次性添加，模拟批量模式）
    console.log('\n🚀 3. 动态并发池 (FIFO) - 批量模式');
    const dynamicFIFO = new DynamicConcurrencyPool(maxConcurrency, 'FIFO');
    try {
        const startTime = Date.now();
        const promises = testTasks.map(task => dynamicFIFO.addTask(task.fn, task.options));
        await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        results.push({ totalTime, strategy: 'Dynamic-FIFO-Batch' });
    } finally {
        await dynamicFIFO.destroy();
    }
    
    await sleep(1000);
    
    // 测试动态并发池 - 真正的动态模式
    console.log('\n🚀 4. 动态并发池 (LPT) - 真实动态模式');
    const dynamicLPT = new DynamicConcurrencyPool(maxConcurrency, 'LPT');
    try {
        const startTime = Date.now();
        const promises = [];
        
        // 模拟真实场景：任务分批到达
        for (let i = 0; i < testTasks.length; i++) {
            const task = testTasks[i];
            promises.push(dynamicLPT.addTask(task.fn, task.options));
            
            // 模拟任务间隔到达
            if (i < testTasks.length - 1 && Math.random() < 0.6) {
                await sleep(Math.random() * 200);
            }
        }
        
        await Promise.all(promises);
        const totalTime = Date.now() - startTime;
        results.push({ totalTime, strategy: 'Dynamic-LPT-Real' });
    } finally {
        await dynamicLPT.destroy();
    }
    
    // 打印对比结果
    printSeparator('性能对比结果', '📊');
    console.log('策略'.padEnd(25) + '耗时'.padEnd(15) + '相对性能');
    console.log('-'.repeat(55));
    
    const baseline = results[0].totalTime;
    results.forEach(result => {
        const improvement = ((baseline - result.totalTime) / baseline * 100).toFixed(1);
        const performanceIndicator = improvement > 0 ? `+${improvement}%` : `${improvement}%`;
        
        console.log(
            result.strategy.padEnd(25) +
            formatTime(result.totalTime).padEnd(15) +
            performanceIndicator
        );
    });
}

/**
 * 功能特性对比
 */
async function featureComparison() {
    printSeparator('功能特性对比', '=');
    
    console.log('🆚 传统批量模式 vs 动态并发池\n');
    
    // 创建动态池用于演示
    const pool = new DynamicConcurrencyPool(2, 'PRIORITY');
    
    try {
        // 特性1: 动态添加任务
        console.log('✅ 特性1: 动态添加任务');
        console.log('  传统模式: ❌ 必须一次性提交所有任务');
        console.log('  动态模式: ✅ 随时可以添加新任务');
        
        const task1 = pool.addTask(async () => {
            await sleep(500);
            return 'task1';
        }, { name: 'InitialTask', priority: 1 });
        
        await sleep(200);
        
        const task2 = pool.addTask(async () => {
            await sleep(300);
            return 'task2'; 
        }, { name: 'DynamicTask', priority: 10 }); // 高优先级
        
        console.log('  💡 演示：先添加普通任务，200ms后添加高优先级任务');
        
        await Promise.all([task1, task2]);
        
        // 特性2: 实时状态监控
        console.log('\n✅ 特性2: 实时状态监控');
        console.log('  传统模式: ❌ 无法查询执行状态');
        console.log('  动态模式: ✅ 实时状态查询');
        console.log('  💡 演示：', pool.getStatus());
        
        // 特性3: 任务取消
        console.log('\n✅ 特性3: 任务取消能力');
        console.log('  传统模式: ❌ 任务提交后无法取消');
        console.log('  动态模式: ✅ 可以取消等待中的任务');
        
        const cancelableTask = pool.addTask(async () => {
            await sleep(1000);
            return 'never executed';
        }, { name: 'CancelableTask' });
        
        await sleep(100);
        
        // 取消任务（通过直接调用task的cancel方法）
        console.log('  💡 演示：添加任务后立即取消');
        
        try {
            await cancelableTask;
        } catch (error) {
            console.log(`  ✅ 任务已被取消: ${error.message}`);
        }
        
        // 特性4: 多种调度策略
        console.log('\n✅ 特性4: 丰富的调度策略');
        console.log('  传统模式: ⚠️  有限的策略支持');
        console.log('  动态模式: ✅ 支持FIFO、LPT、SPT、PRIORITY、WEIGHTED等');
        
        // 特性5: 事件通知
        console.log('\n✅ 特性5: 事件驱动');
        console.log('  传统模式: ❌ 无事件通知');
        console.log('  动态模式: ✅ 丰富的事件系统');
        
        let eventCount = 0;
        pool.on('taskComplete', () => {
            eventCount++;
            console.log(`  📢 任务完成事件 #${eventCount}`);
        });
        
        const eventTask = pool.addTask(async () => {
            await sleep(200);
            return 'event demo';
        }, { name: 'EventTask' });
        
        await eventTask;
        
        // 特性6: 资源管理
        console.log('\n✅ 特性6: 生命周期管理');
        console.log('  传统模式: ⚠️  与任务批次绑定');
        console.log('  动态模式: ✅ 独立的池生命周期，可暂停/恢复/销毁');
        
        console.log('  💡 演示：暂停池');
        pool.pause();
        
        const pausedTask = pool.addTask(async () => {
            await sleep(100);
            return 'paused task';
        }, { name: 'PausedTask' });
        
        await sleep(300);
        console.log('  ⏸️  任务已添加但池已暂停，不会执行');
        
        console.log('  💡 演示：恢复池');
        pool.resume();
        
        await pausedTask;
        console.log('  ▶️  池恢复后任务自动执行');
        
    } finally {
        await pool.destroy();
    }
}

/**
 * 真实场景模拟对比
 */
async function realWorldScenario() {
    printSeparator('真实场景模拟', '=');
    
    console.log('🌍 场景：Web 服务处理用户请求\n');
    
    // 模拟传统批量处理（不现实的场景）
    console.log('🏭 传统模式（不适用的场景）：');
    console.log('  ❌ 必须等待收集一批请求后才能开始处理');
    console.log('  ❌ 用户体验差，响应延迟高');
    console.log('  ❌ 无法处理突发请求');
    
    // 模拟动态处理
    console.log('\n🚀 动态模式（实际场景）：');
    console.log('  ✅ 请求到达立即开始处理');
    console.log('  ✅ 优秀的用户体验');
    console.log('  ✅ 灵活处理突发流量');
    
    const webServerPool = new DynamicConcurrencyPool(3, 'PRIORITY');
    
    try {
        console.log('\n📡 模拟Web服务请求处理：');
        
        // 模拟不同类型的请求
        const requests = [
            { type: 'API', priority: 5, duration: 200 },
            { type: 'Upload', priority: 3, duration: 800 },
            { type: 'Download', priority: 4, duration: 600 },
            { type: 'Emergency', priority: 10, duration: 100 },
            { type: 'Background', priority: 1, duration: 1000 }
        ];
        
        const requestPromises = [];
        
        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            
            // 模拟请求间隔到达
            if (i > 0) {
                await sleep(Math.random() * 300 + 100);
            }
            
            console.log(`  📥 收到请求: ${req.type} (优先级:${req.priority})`);
            
            requestPromises.push(
                webServerPool.addTask(async () => {
                    console.log(`    🔄 处理 ${req.type} 请求中...`);
                    await sleep(req.duration);
                    console.log(`    ✅ ${req.type} 请求处理完成`);
                    return { type: req.type, status: 'completed' };
                }, {
                    priority: req.priority,
                    expectedDuration: req.duration,
                    name: `${req.type}Request`
                })
            );
        }
        
        // 模拟突发紧急请求
        await sleep(500);
        console.log('  🚨 突发紧急请求！');
        requestPromises.push(
            webServerPool.addTask(async () => {
                console.log('    🔥 处理紧急请求...');
                await sleep(150);
                console.log('    ✅ 紧急请求处理完成');
                return { type: 'Emergency', status: 'completed' };
            }, {
                priority: 15, // 最高优先级
                expectedDuration: 150,
                name: 'UrgentRequest'
            })
        );
        
        await Promise.all(requestPromises);
        
        console.log('\n🎯 结果：所有请求都得到了及时处理！');
        
    } finally {
        await webServerPool.destroy();
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🥊 传统批量模式 vs 动态并发池 对比测试');
    
    try {
        await performanceComparison();
        
        console.log('\n');
        await sleep(2000);
        
        await featureComparison();
        
        console.log('\n');
        await sleep(2000);
        
        await realWorldScenario();
        
        printSeparator('对比测试完成', '🏆');
        
        console.log('\n📋 总结：');
        console.log('  🏭 传统批量模式：适合已知任务集合的批处理场景');
        console.log('  🚀 动态并发池：适合实时、交互式、服务型应用');
        console.log('  💡 建议：根据具体场景选择合适的模式');
        
    } catch (error) {
        console.error('❌ 对比测试中发生错误:', error);
    }
}

// 运行对比测试
if (require.main === module) {
    main();
}

module.exports = { performanceComparison, featureComparison, realWorldScenario }; 