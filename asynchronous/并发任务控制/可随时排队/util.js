/**
 * 工具函数集合
 */

// 延时函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 创建模拟任务
const createSimpleTask = (taskId, duration, result = null) => {
    return async function simpleTask() {
        console.log(`  → 任务${taskId} 执行中...`);
        await sleep(duration);
        const taskResult = result !== null ? result : taskId;
        console.log(`  ← 任务${taskId} 执行完毕，结果: ${taskResult}`);
        return taskResult;
    };
};

// 创建可能失败的任务
const createFailableTask = (taskId, duration, failRate = 0.2) => {
    return async function failableTask() {
        console.log(`  → 任务${taskId} 执行中（可能失败）...`);
        await sleep(duration);
        
        if (Math.random() < failRate) {
            throw new Error(`任务${taskId}执行失败`);
        }
        
        console.log(`  ← 任务${taskId} 执行成功`);
        return taskId;
    };
};

// 创建网络请求模拟任务
const createNetworkTask = (url, timeout) => {
    return async function networkTask() {
        console.log(`  → 请求 ${url}...`);
        await sleep(timeout);
        
        // 模拟网络错误
        if (Math.random() < 0.1) {
            throw new Error(`网络请求失败: ${url}`);
        }
        
        const response = { url, status: 200, data: `数据来自${url}`, responseTime: timeout };
        console.log(`  ← 请求完成 ${url} (${timeout}ms)`);
        return response;
    };
};

// 创建数据处理任务
const createDataProcessTask = (dataId, complexity) => {
    const duration = complexity * 100; // 复杂度影响耗时
    
    return async function processData() {
        console.log(`  → 处理数据 ${dataId} (复杂度: ${complexity})...`);
        await sleep(duration);
        
        const result = {
            dataId,
            complexity,
            processedAt: Date.now(),
            result: `处理结果-${dataId}`
        };
        
        console.log(`  ← 数据 ${dataId} 处理完毕`);
        return result;
    };
};

// 创建文件上传模拟任务
const createUploadTask = (fileName, fileSize) => {
    // 文件大小影响上传时间
    const duration = Math.floor(fileSize / 1024) * 10; // 每KB需要10ms
    
    return async function uploadFile() {
        console.log(`  → 上传文件 ${fileName} (${fileSize} bytes)...`);
        
        // 模拟上传进度
        const chunks = Math.ceil(fileSize / 1024);
        for (let i = 0; i < chunks; i++) {
            await sleep(duration / chunks);
            if (i % Math.max(1, Math.floor(chunks / 4)) === 0) {
                console.log(`    上传进度: ${Math.floor((i / chunks) * 100)}%`);
            }
        }
        
        const result = {
            fileName,
            fileSize,
            uploadedAt: Date.now(),
            fileId: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
        };
        
        console.log(`  ← 文件 ${fileName} 上传完毕，ID: ${result.fileId}`);
        return result;
    };
};

// 批量创建测试任务
const createTestTasks = () => {
    return [
        { fn: createSimpleTask(1, 300), options: { expectedDuration: 300, name: 'SimpleTask1' } },
        { fn: createSimpleTask(2, 200), options: { expectedDuration: 200, name: 'SimpleTask2' } },
        { fn: createSimpleTask(3, 400), options: { expectedDuration: 400, name: 'SimpleTask3' } },
        { fn: createNetworkTask('api/users', 500), options: { expectedDuration: 500, name: 'NetworkTask1' } },
        { fn: createNetworkTask('api/posts', 800), options: { expectedDuration: 800, name: 'NetworkTask2' } },
        { fn: createDataProcessTask('data-001', 3), options: { expectedDuration: 300, priority: 5, name: 'DataProcess1' } },
        { fn: createDataProcessTask('data-002', 7), options: { expectedDuration: 700, priority: 8, name: 'DataProcess2' } },
        { fn: createUploadTask('document.pdf', 2048), options: { expectedDuration: 200, priority: 3, name: 'Upload1' } },
        { fn: createUploadTask('image.jpg', 5120), options: { expectedDuration: 500, priority: 6, name: 'Upload2' } },
        { fn: createFailableTask(10, 600, 0.3), options: { expectedDuration: 600, name: 'FailableTask' } }
    ];
};

// 打印分隔线
const printSeparator = (title = '', char = '=', width = 60) => {
    if (title) {
        const padding = Math.max(0, Math.floor((width - title.length - 2) / 2));
        const line = char.repeat(padding) + ` ${title} ` + char.repeat(padding);
        console.log(line.padEnd(width, char));
    } else {
        console.log(char.repeat(width));
    }
};

// 格式化时间
const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
};

// 等待用户输入（仅用于演示）
const waitForInput = (message = '按 Enter 继续...') => {
    console.log(message);
    return new Promise(resolve => {
        process.stdin.once('data', () => resolve());
    });
};

module.exports = {
    sleep,
    createSimpleTask,
    createFailableTask,
    createNetworkTask,
    createDataProcessTask,
    createUploadTask,
    createTestTasks,
    printSeparator,
    formatTime,
    waitForInput
}; 