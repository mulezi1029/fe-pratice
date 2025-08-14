const { runFIFO } = require('./demo_fifo.js');
const { runLPT } = require('./demo_optimize_lpt.js');
const { setupLogging } = require('./util.js');

// 设置日志记录
setupLogging();

// 主函数：运行并发控制策略比较
async function runComparison() {
  console.log('\n========== 并发控制策略比较测试 ==========\n');
  
  const maxConcurrency = 3;
  const results = [];
  
  try {
    console.log(`开始测试，最大并发数: ${maxConcurrency}\n`);
    
    // 运行 FIFO 策略
    console.log('🚀 开始执行 FIFO 策略...');
    const fifoResult = await runFIFO(maxConcurrency);
    results.push(fifoResult);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    // 运行 LPT 策略  
    console.log('🚀 开始执行 LPT 策略...');
    const lptResult = await runLPT(maxConcurrency);
    results.push(lptResult);
    
    // 比较结果
    console.log('\n' + '='.repeat(60));
    console.log('📊 策略比较结果:');
    console.log('='.repeat(60));
    
    results.forEach(result => {
      console.log(`${result.strategy} 策略: ${result.totalTime}ms`);
    });
    
    const fifoTime = results[0].totalTime;
    const lptTime = results[1].totalTime;
    const improvement = fifoTime - lptTime;
    const improvementPercentage = ((improvement / fifoTime) * 100).toFixed(2);
    
    console.log('\n📈 性能分析:');
    if (improvement > 0) {
      console.log(`✅ LPT 策略比 FIFO 策略快 ${improvement}ms (${improvementPercentage}%)`);
    } else if (improvement < 0) {
      console.log(`✅ FIFO 策略比 LPT 策略快 ${Math.abs(improvement)}ms (${Math.abs(improvementPercentage)}%)`);
    } else {
      console.log(`⚖️  两种策略耗时相同`);
    }
    
    console.log('\n🎯 结论:');
    if (improvement > 0) {
      console.log('LPT (Longest Processing Time First) 策略通过优先执行耗时长的任务,');
      console.log('能够更好地利用并发资源，减少整体完成时间。');
    } else {
      console.log('在当前任务配置下，两种策略性能接近。');
      console.log('LPT 优势可能在更复杂的任务分布中体现。');
    }
    
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行比较测试
runComparison();
