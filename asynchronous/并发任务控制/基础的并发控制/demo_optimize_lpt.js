const {
	setupLogging,
	createTaskConfig,
	calculateTheoreticalLowerBound,
} = require('./util.js')

setupLogging()
console.log('\n===== LPT Pool Run =====\n')

// LPT 并发池：限制同一时刻最多运行 maxConcurrency 个任务，按耗时长短优先调度
function createLPTPool(maxConcurrency) {
	let activeCount = 0
	const waitingQueue = []

	// 控制并发数的执行器
	const executeTask = async (taskFunction) => {
		console.log(`处理任务：${taskFunction.fnName}`)
		// 如果当前并发数达到上限，将准备执行的任务加入等待队列
		if (activeCount >= maxConcurrency) {
			console.log(`并发数已达上限，${taskFunction.fnName} 加入等待队列`)
			await new Promise((resolve) =>
				waitingQueue.push({
					resolve,
					fnName: taskFunction.fnName,
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
			// 如果等待队列中有任务，则执行下一个任务
			if (waitingQueue.length) {
				const nextTask = waitingQueue.shift()
				console.log(`${nextTask.fnName} 从等待队列中取出，准备执行`)
				nextTask.resolve()
			}
		}
	}

	// 批量执行：按预计耗时长任务优先调度，但保持最终结果顺序
	return (taskFunctions) => {
		const indexes = taskFunctions.map((_, idx) => idx)
		// 根据 expectedDuration 降序排序索引，实现 LPT 调度
		indexes.sort((a, b) => {
			const durA = taskFunctions[a].expectedDuration || 0
			const durB = taskFunctions[b].expectedDuration || 0
			return durB - durA
		})
		// 按排序后的索引顺序启动任务，将 Promise 放回原位置
		const promises = new Array(taskFunctions.length)
		for (const idx of indexes) {
			promises[idx] = executeTask(taskFunctions[idx])
		}
		// 结果顺序保持与调用方一致
		return Promise.all(promises)
	}
}

// 执行 LPT 版本
const runLPT = async (maxConcurrency = 5) => {
	const startTime = Date.now()
	const taskPool = createLPTPool(maxConcurrency)
	const taskFunctions = createTaskConfig(startTime)

	console.log(
		'总耗时理论值下界：',
		calculateTheoreticalLowerBound(taskFunctions, maxConcurrency)
	)

	const results = await taskPool(taskFunctions)
	console.log('LPT Results:', results)

	const totalTime = Date.now() - startTime
	console.log(`LPT 总耗时: ${totalTime}ms`)

	return { results, totalTime, strategy: 'LPT' }
}

// 如果直接运行此文件
if (require.main === module) {
	;(async () => {
		const maxConcurrency = 3
		await runLPT(maxConcurrency)
	})()
}

module.exports = { runLPT }
