/**
 * 任务包装器类
 * 负责包装任务函数，管理任务状态和生命周期
 */
class TaskWrapper {
    constructor(taskFunction, options = {}) {
        // 生成唯一任务ID
        this.id = this._generateId();
        
        // 任务函数和配置
        this.taskFunction = taskFunction;
        this.priority = options.priority || 0;
        this.expectedDuration = options.expectedDuration || 0;
        this.createdAt = Date.now();
        
        // 任务状态：pending, running, completed, failed
        this.status = 'pending';
        this.startTime = null;
        this.endTime = null;
        this.result = null;
        this.error = null;
        
        // 创建Promise供外部等待
        this.promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        
        // 为日志显示添加任务名称
        this.fnName = options.name || taskFunction.name || `Task_${this.id}`;
    }
    
    /**
     * 执行任务
     */
    async execute() {
        if (this.status !== 'pending') {
            throw new Error(`Task ${this.id} is not in pending status, current: ${this.status}`);
        }
        
        this.status = 'running';
        this.startTime = Date.now();
        
        try {
            console.log(`${this.fnName} 开始执行 @${this.startTime - this.createdAt}ms`);
            
            // 执行任务函数
            this.result = await this.taskFunction();
            
            this.status = 'completed';
            this.endTime = Date.now();
            
            console.log(`${this.fnName} 执行完毕，耗时: ${this.endTime - this.startTime}ms`);
            
            // 通知等待者
            this._resolve(this.result);
            
            return this.result;
        } catch (error) {
            this.status = 'failed';
            this.endTime = Date.now();
            this.error = error;
            
            console.log(`${this.fnName} 执行失败: ${error.message}`);
            
            // 通知等待者
            this._reject(error);
            
            throw error;
        }
    }
    
    /**
     * 获取任务执行时长
     */
    getDuration() {
        if (this.status === 'pending' || this.status === 'running') {
            return null;
        }
        return this.endTime - this.startTime;
    }
    
    /**
     * 获取任务等待时长
     */
    getWaitTime() {
        if (this.startTime === null) {
            return Date.now() - this.createdAt;
        }
        return this.startTime - this.createdAt;
    }
    
    /**
     * 取消任务（仅对pending状态有效）
     */
    cancel(reason = 'Task cancelled') {
        if (this.status === 'pending') {
            this.status = 'failed';
            this.error = new Error(reason);
            this._reject(this.error);
            return true;
        }
        return false;
    }
    
    /**
     * 获取任务信息
     */
    getInfo() {
        return {
            id: this.id,
            fnName: this.fnName,
            status: this.status,
            priority: this.priority,
            expectedDuration: this.expectedDuration,
            actualDuration: this.getDuration(),
            waitTime: this.getWaitTime(),
            createdAt: this.createdAt,
            startTime: this.startTime,
            endTime: this.endTime
        };
    }
    
    /**
     * 生成唯一ID
     */
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
}

module.exports = TaskWrapper; 