const { setupLogging, createTaskConfig, calculateTheoreticalLowerBound } = require('./util.js');

setupLogging();
console.log('\n===== FIFO Pool Run =====\n');

// FIFO 并发池：仅控制并发上限，不做耗时排序
function createFIFOPool(maxConcurrency) {
	let activeCount = 0;
	const waitingQueue = [];

	const executeTask = async (taskFunction) => {
		console.log(`处理任务：${taskFunction.fnName}`);
		// 如果当前并发数大于等于最大并发数，则将任务加入等待队列
		if (activeCount >= maxConcurrency) {
			console.log(`并发数已达上限，${taskFunction.fnName} 加入等待队列`);
			await new Promise(resolve => waitingQueue.push({ resolve, fnName: taskFunction.fnName }));
		}
		// 如果当前并发数小于最大并发数，则执行此任务，增加当前并发数量
		activeCount++;
		try {
			// 执行任务
			console.log(`${taskFunction.fnName} 开始执行，当前并发数: ${activeCount}`);
			return await taskFunction();
		} finally {
			// 任务执行完毕，减少当前的并发数
			activeCount--;
			console.log(`${taskFunction.fnName} 执行完毕，当前并发数: ${activeCount}`);
			// 如果等待队列中有任务，则取出第一个任务，并执行
			if (waitingQueue.length) {
				const nextTask = waitingQueue.shift();
				console.log(`${nextTask.fnName} 从等待队列中取出，准备执行`);
				nextTask.resolve();
			}
		}
	};

	// 批量执行：保持调用顺序
	return (taskFunctions) => Promise.all(taskFunctions.map(executeTask));
}

// 执行 FIFO 版本
const runFIFO = async (maxConcurrency = 5) => {
	const startTime = Date.now();
	const taskPool = createFIFOPool(maxConcurrency);
	const taskFunctions = createTaskConfig(startTime);

	console.log('总耗时理论值下界：', calculateTheoreticalLowerBound(taskFunctions, maxConcurrency));
	
	const results = await taskPool(taskFunctions);
	console.log('FIFO Results:', results);
	
	const totalTime = Date.now() - startTime;
	console.log(`FIFO 总耗时: ${totalTime}ms`);
	
	return { results, totalTime, strategy: 'FIFO' };
};

// 如果直接运行此文件
if (require.main === module) {
	(async () => {
		const maxConcurrency = 3;
		await runFIFO(maxConcurrency);
	})();
}

module.exports = { runFIFO }; 