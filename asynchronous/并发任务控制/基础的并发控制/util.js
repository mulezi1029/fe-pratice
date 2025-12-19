const fs = require('fs');
const path = require('path');

// 工具：延时函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 构建任务
const buildTask = (taskId, duration, startTime) => {
	async function taskFn() {
		const taskStart = Date.now() - startTime;
		console.log(`Task${taskId} start @${taskStart}ms`);
		await sleep(duration);
		const taskEnd = Date.now() - startTime;
		console.log(`Task${taskId} end   @${taskEnd}ms`);
		return taskId;
  };
  taskFn.fnName = `Task${taskId}`;
  taskFn.expectedDuration = duration;
  return taskFn;
}

// 设置日志记录到文件
const setupLogging = (logFileName = 'run_compare.log') => {
  const logStream = fs.createWriteStream(path.resolve(__dirname,'./log', logFileName), { flags: 'w' });
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    originalConsoleLog(...args);
    logStream.write(args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join(' ') + '\n');
  };
  return logStream;
};

// 创建测试任务配置
const createTaskConfig = (startTime) => {
	const taskTimeList = [300, 200, 400, 100, 500, 900, 1000, 1100, 2500, 10000];
	const taskList = taskTimeList.map((time, index) => buildTask(index + 1, time, startTime));
	return taskList;
};

// 计算理论下界耗时：理论上，所有任务的耗时的最大值，或者是所有任务的总耗时除以最大并发数的最大值
const calculateTheoreticalLowerBound = (taskFunctions, maxConcurrency) => {
  const totalDuration = taskFunctions.reduce((acc, task) => acc + task.expectedDuration, 0);
  const maxSingleDuration = Math.max(...taskFunctions.map(task => task.expectedDuration));
  return Math.max(totalDuration / maxConcurrency, maxSingleDuration);
};

module.exports = {
  sleep,
  buildTask,
  setupLogging,
  createTaskConfig,
  calculateTheoreticalLowerBound
};