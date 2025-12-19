const DynamicConcurrencyPool = require('./DynamicConcurrencyPool');
const { 
    createSimpleTask, 
    createNetworkTask, 
    sleep, 
    printSeparator 
} = require('./util');

/**
 * 基础演示：展示动态添加任务的能力
 */
async function basicDemo() {
    printSeparator('基础演示：动态添加任务', '=');
    
    // 创建并发池，最大并发数为 3
    const pool = new DynamicConcurrencyPool(3, 'FIFO');
    
    try {
        console.log('\n🚀 1. 立即添加3个任务');
        
        // 立即添加3个任务
        const task1 = pool.addTask(createSimpleTask(1, 500), { 
            expectedDuration: 500, 
            name: 'Task1' 
        });
        
        const task2 = pool.addTask(createSimpleTask(2, 300), { 
            expectedDuration: 300, 
            name: 'Task2' 
        });
        
        const task3 = pool.addTask(createSimpleTask(3, 800), { 
            expectedDuration: 800, 
            name: 'Task3' 
        });
        
        // 打印当前状态
        console.log(`当前池状态:`, pool.getStatus());
        
        console.log('\n⏰ 2. 等待1秒后再添加更多任务');
        await sleep(1000);
        
        // 动态添加更多任务
        const task4 = pool.addTask(createSimpleTask(4, 200), { 
            expectedDuration: 200, 
            name: 'Task4' 
        });
        
        const task5 = pool.addTask(createNetworkTask('api/data', 400), { 
            expectedDuration: 400, 
            name: 'NetworkTask' 
        });
        
        console.log('\n⏰ 3. 再等待2秒后添加最后一个任务');
        await sleep(2000);
        
        const task6 = pool.addTask(createSimpleTask(6, 100), { 
            expectedDuration: 100, 
            name: 'Task6' 
        });
        
        console.log('\n⏳ 4. 等待所有任务完成...');
        
        // 可以独立等待每个任务的结果
        const results = await Promise.allSettled([
            task1, task2, task3, task4, task5, task6
        ]);
        
        console.log('\n✅ 所有任务执行结果:');
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                console.log(`  任务${index + 1}: 成功 -> ${JSON.stringify(result.value)}`);
            } else {
                console.log(`  任务${index + 1}: 失败 -> ${result.reason.message}`);
            }
        });
        
    } finally {
        // 清理资源
        await pool.destroy();
    }
}

/**
 * 交互式演示：手动控制任务添加
 */
async function interactiveDemo() {
    printSeparator('交互式演示：手动控制', '=');
    
    const pool = new DynamicConcurrencyPool(2, 'FIFO');
    
    try {
        console.log('\n📱 这是一个交互式演示，你可以：');
        console.log('  - 看到任务实时添加和执行');
        console.log('  - 观察并发控制的效果');
        
        const taskPromises = [];
        
        // 模拟用户在不同时间提交任务
        console.log('\n🎭 模拟用户行为：');
        
        // 第一批：立即提交
        console.log('  👤 用户A 提交了3个任务');
        taskPromises.push(
            pool.addTask(createSimpleTask('A1', 400), { name: 'UserA_Task1' }),
            pool.addTask(createSimpleTask('A2', 600), { name: 'UserA_Task2' }),
            pool.addTask(createSimpleTask('A3', 200), { name: 'UserA_Task3' })
        );
        
        await sleep(500);
        
        // 第二批：延迟提交
        console.log('  👤 用户B 提交了2个任务');
        taskPromises.push(
            pool.addTask(createNetworkTask('user-b/profile', 300), { name: 'UserB_Profile' }),
            pool.addTask(createNetworkTask('user-b/settings', 500), { name: 'UserB_Settings' })
        );
        
        await sleep(800);
        
        // 第三批：更晚提交
        console.log('  👤 用户C 提交了1个紧急任务');
        taskPromises.push(
            pool.addTask(createSimpleTask('C1', 150), { 
                name: 'UserC_Urgent', 
                priority: 10 
            })
        );
        
        // 监听池状态变化
        pool.on('idle', () => {
            console.log('🏖️  池子空闲了，没有待处理的任务');
        });
        
        console.log('\n⏳ 等待所有用户任务完成...');
        await Promise.allSettled(taskPromises);
        
    } finally {
        await pool.destroy();
    }
}

/**
 * 实时状态监控演示
 */
async function statusMonitorDemo() {
    printSeparator('实时状态监控演示', '=');
    
    const pool = new DynamicConcurrencyPool(2, 'LPT');
    
    // 状态监控器
    const statusMonitor = setInterval(() => {
        const status = pool.getStatus();
        console.log(`📊 [状态] 等待:${status.pendingCount} | 执行中:${status.runningCount} | 已完成:${status.completedCount}`);
    }, 800);
    
    try {
        // 添加不同耗时的任务
        const tasks = [
            { duration: 1000, name: 'LongTask' },
            { duration: 300, name: 'ShortTask1' },
            { duration: 500, name: 'MediumTask' },
            { duration: 200, name: 'ShortTask2' },
            { duration: 800, name: 'LongTask2' }
        ];
        
        const taskPromises = [];
        
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];
            console.log(`➕ 添加任务: ${task.name} (${task.duration}ms)`);
            
            taskPromises.push(
                pool.addTask(createSimpleTask(i + 1, task.duration), {
                    expectedDuration: task.duration,
                    name: task.name
                })
            );
            
            // 每隔一段时间添加一个任务
            if (i < tasks.length - 1) {
                await sleep(400);
            }
        }
        
        await Promise.allSettled(taskPromises);
        
    } finally {
        clearInterval(statusMonitor);
        await pool.destroy();
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('🎪 动态并发池演示程序');
    
    try {
        await basicDemo();
        
        console.log('\n');
        await sleep(2000);
        
        await interactiveDemo();
        
        console.log('\n');
        await sleep(2000);
        
        await statusMonitorDemo();
        
        printSeparator('所有演示完成', '🎉');
        
    } catch (error) {
        console.error('❌ 演示过程中发生错误:', error);
    }
}

// 运行演示
if (require.main === module) {
    main();
}

module.exports = { basicDemo, interactiveDemo, statusMonitorDemo }; 