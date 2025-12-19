const DynamicConcurrencyPool = require('./DynamicConcurrencyPool');
const { StrategyFactory } = require('./ScheduleStrategy');
const { basicDemo, interactiveDemo, statusMonitorDemo } = require('./demo_basic');
const { performanceComparison, featureComparison, realWorldScenario } = require('./demo_comparison');
const { printSeparator, sleep } = require('./util');

/**
 * 主入口文件
 * 展示所有可随时排队的并发池功能
 */

async function showIntroduction() {
    printSeparator('可随时排队的并发池控制方案', '🎯');
    
    console.log('💡 这是一个全新的并发控制方案，具有以下特点：\n');
    
    console.log('🚀 核心特性：');
    console.log('  ✅ 随时动态添加任务 - 无需预先收集任务');
    console.log('  ✅ 多种调度策略 - FIFO、LPT、SPT、PRIORITY、WEIGHTED');
    console.log('  ✅ 实时状态监控 - 随时查询池状态和任务进度');
    console.log('  ✅ 灵活的生命周期管理 - 暂停、恢复、取消、销毁');
    console.log('  ✅ 事件驱动架构 - 丰富的事件通知机制');
    console.log('  ✅ 完整的错误处理 - 优雅的异常处理和恢复');
    
    console.log('\n🎯 适用场景：');
    console.log('  • Web服务器请求处理');
    console.log('  • 实时数据处理系统'); 
    console.log('  • 文件上传/下载管理');
    console.log('  • 后台任务调度系统');
    console.log('  • 微服务间异步调用');
    
    console.log('\n📋 可用策略：');
    StrategyFactory.getAvailableStrategies().forEach(strategy => {
        console.log(`  • ${strategy}`);
    });
    
    console.log('\n🏗️  架构组件：');
    console.log('  • DynamicConcurrencyPool - 核心并发池');
    console.log('  • TaskWrapper - 任务包装和状态管理');
    console.log('  • ScheduleStrategy - 可插拔调度策略');
    console.log('  • EventEmitter - 事件通知系统');
    
    await sleep(2000);
}

async function showQuickStart() {
    printSeparator('快速开始', '⚡');
    
    console.log('💻 基本用法：\n');
    
    console.log('```javascript');
    console.log('const DynamicConcurrencyPool = require("./DynamicConcurrencyPool");');
    console.log('');
    console.log('// 创建并发池');
    console.log('const pool = new DynamicConcurrencyPool(3, "FIFO");');
    console.log('');
    console.log('// 随时添加任务');
    console.log('const task1 = pool.addTask(async () => {');
    console.log('    // 你的异步任务');
    console.log('    return "result";');
    console.log('}, { expectedDuration: 1000 });');
    console.log('');
    console.log('// 等待结果');
    console.log('const result = await task1;');
    console.log('');
    console.log('// 清理资源');
    console.log('await pool.destroy();');
    console.log('```\n');
    
    console.log('🎮 现场演示：');
    
    const quickPool = new DynamicConcurrencyPool(2, 'FIFO', { enableMetrics: false });
    
    try {
        const startTime = Date.now();
        
        const task1 = quickPool.addTask(async () => {
            console.log('  🔄 任务1执行中...');
            await sleep(800);
            console.log('  ✅ 任务1完成');
            return 'Task1 Result';
        }, { name: 'QuickDemo1' });
        
        await sleep(200);
        
        const task2 = quickPool.addTask(async () => {
            console.log('  🔄 任务2执行中...');  
            await sleep(400);
            console.log('  ✅ 任务2完成');
            return 'Task2 Result';
        }, { name: 'QuickDemo2' });
        
        const results = await Promise.all([task1, task2]);
        
        const totalTime = Date.now() - startTime;
        console.log(`\n📊 演示结果: ${JSON.stringify(results)}`);
        console.log(`⏱️  总耗时: ${totalTime}ms`);
        
    } finally {
        await quickPool.destroy();
    }
    
    await sleep(1000);
}

async function showMenu() {
    console.log('\n🎪 选择你想要查看的演示：\n');
    
    const options = [
        '1. 基础功能演示 (推荐开始)',
        '2. 性能对比测试',
        '3. 功能特性对比', 
        '4. 真实场景模拟',
        '5. 运行所有演示',
        '0. 退出程序'
    ];
    
    options.forEach(option => console.log(`  ${option}`));
    
    console.log('\n💡 提示：每个演示都是独立的，可以单独运行');
    console.log('⚠️  注意：本程序为演示目的，实际输出较多\n');
}

async function runSelectedDemo(choice) {
    switch(choice) {
        case '1':
            await basicDemo();
            await sleep(1000);
            await interactiveDemo();
            await sleep(1000);
            await statusMonitorDemo();
            break;
            
        case '2':
            await performanceComparison();
            break;
            
        case '3':
            await featureComparison();
            break;
            
        case '4':
            await realWorldScenario();
            break;
            
        case '5':
            await basicDemo();
            await sleep(2000);
            await interactiveDemo();
            await sleep(2000);
            await statusMonitorDemo();
            await sleep(2000);
            await performanceComparison();
            await sleep(2000);
            await featureComparison();
            await sleep(2000);
            await realWorldScenario();
            break;
            
        case '0':
            console.log('👋 感谢使用！');
            return false;
            
        default:
            console.log('❌ 无效选择，请重试');
            return true;
    }
    
    return true;
}

async function interactiveMode() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const askQuestion = (question) => {
        return new Promise(resolve => {
            rl.question(question, resolve);
        });
    };
    
    try {
        let continueDemo = true;
        
        while (continueDemo) {
            await showMenu();
            
            const choice = await askQuestion('请输入你的选择 (0-5): ');
            console.log('');
            
            continueDemo = await runSelectedDemo(choice.trim());
            
            if (continueDemo) {
                console.log('\n' + '='.repeat(60));
                const nextAction = await askQuestion('按 Enter 返回菜单，或输入 q 退出: ');
                if (nextAction.toLowerCase() === 'q') {
                    continueDemo = false;
                }
                console.log('\n');
            }
        }
        
    } finally {
        rl.close();
    }
}

async function automaticDemo() {
    console.log('🤖 自动演示模式（所有功能）\n');
    
    await showQuickStart();
    
    console.log('\n📚 开始完整演示...\n');
    
    await basicDemo();
    
    printSeparator('演示间隔', '-');
    await sleep(3000);
    
    await interactiveDemo();
    
    printSeparator('演示间隔', '-');
    await sleep(3000);
    
    await statusMonitorDemo();
    
    printSeparator('演示间隔', '-');
    await sleep(3000);
    
    await performanceComparison();
    
    printSeparator('演示间隔', '-');
    await sleep(3000);
    
    await featureComparison();
    
    printSeparator('演示间隔', '-');
    await sleep(3000);
    
    await realWorldScenario();
    
    printSeparator('所有演示完成', '🎉');
}

/**
 * 主函数
 */
async function main() {
    console.clear();
    
    await showIntroduction();
    await showQuickStart();
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    const isAutoMode = args.includes('--auto') || args.includes('-a');
    
    try {
        if (isAutoMode) {
            await automaticDemo();
        } else {
            await interactiveMode();
        }
        
        console.log('\n🎊 感谢体验动态并发池控制方案！');
        console.log('💡 这个方案展示了从"批量处理"到"服务模式"的并发控制升级');
        console.log('🚀 希望对你的项目有帮助！\n');
        
    } catch (error) {
        console.error('\n❌ 程序执行过程中发生错误:', error);
        process.exit(1);
    }
}

// 导出主要功能
module.exports = {
    DynamicConcurrencyPool,
    StrategyFactory,
    basicDemo,
    interactiveDemo, 
    statusMonitorDemo,
    performanceComparison,
    featureComparison,
    realWorldScenario
};

// 如果直接运行此文件
if (require.main === module) {
    main().catch(console.error);
} 