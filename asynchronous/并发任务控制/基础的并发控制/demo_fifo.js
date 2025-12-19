const {
	setupLogging,
	createTaskConfig,
	calculateTheoreticalLowerBound,
} = require('./util.js')

setupLogging()
console.log('\n===== FIFO Pool Run =====\n')

// FIFO 并发池：仅控制并发上限，不做耗时排序
function createFIFOPool(maxConcurrency) {
	let activeCount = 0			// 当前正在执行的任务数量
	const waitingQueue = []		// 等待队列，存储等待执行的任务

	/**
	 * 执行任务的函数，处理并发控制和等待队列
	 * @param {Function} taskFunction - 待执行的任务函数
	 * @returns {Promise} - 任务执行完成后的 Promise
	 */
	const executeTask = async (taskFunction) => {
		console.log(`处理任务：${taskFunction.fnName}`)
		// 如果当前并发数大于等于最大并发数，则将任务加入等待队列
		if (activeCount >= maxConcurrency) {
			console.log(`并发数已达上限，${taskFunction.fnName} 加入等待队列`)
			await new Promise((resolve) =>
				waitingQueue.push({
					resolve,
					fnName: taskFunction.fnName
				})
			)
		}
		// 如果当前并发数小于最大并发数，则执行此任务，增加当前并发数量
		activeCount++
		try {
			// 执行任务
			console.log(`${taskFunction.fnName} 开始执行，当前并发数: ${activeCount}`)
			return await taskFunction()
		} finally {
			// 任务执行完毕，减少当前的并发数
			activeCount--
			console.log(`${taskFunction.fnName} 执行完毕，当前并发数: ${activeCount}`)
			// 如果等待队列中有任务，则取出第一个任务，并执行
			if (waitingQueue.length) {
				const nextTask = waitingQueue.shift()
				console.log(`${nextTask.fnName} 从等待队列中取出，准备执行`)
				nextTask.resolve()
			}
		}
	}

	/**
	 * 批量执行任务，保持调用顺序
	 * @param {Array<Function>} taskFunctions - 待执行的任务函数数组
	 * @returns {Promise<Array>} - 按顺序执行完成后的结果数组
	 */
	const arrangeTasks = (taskFunctions) => Promise.all(taskFunctions.map(executeTask))

	// 返回任务管理函数
	return arrangeTasks
}

// 执行 FIFO 版本
const runFIFO = async (maxConcurrency = 5) => {
	const startTime = Date.now()
	const taskPool = createFIFOPool(maxConcurrency)				// 创建 FIFO 并发池
	const taskFunctions = createTaskConfig(startTime)			//创建测试任务

	// 计算理论下界耗时：理论上，所有任务的耗时的最大值，或者是所有任务的总耗时除以最大并发数的最大值
	console.log(
		'总耗时理论值下界：',
		calculateTheoreticalLowerBound(taskFunctions, maxConcurrency)
	)

	const results = await taskPool(taskFunctions)
	console.log('FIFO Results:', results)

	const totalTime = Date.now() - startTime
	console.log(`FIFO 总耗时: ${totalTime}ms`)

	return { results, totalTime, strategy: 'FIFO' }
}

// 如果直接运行此文件
if (require.main === module) {
	;(async () => {
		const maxConcurrency = 3
		await runFIFO(maxConcurrency)
	})()
}

module.exports = { runFIFO }
