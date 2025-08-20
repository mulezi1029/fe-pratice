const TaskWrapper = require('./TaskWrapper');
const { StrategyFactory } = require('./ScheduleStrategy');
const EventEmitter = require('events');

/**
 * 动态并发池
 * 支持随时添加任务的并发控制池
 */
class DynamicConcurrencyPool extends EventEmitter {
    constructor(maxConcurrency = 5, strategy = 'FIFO', options = {}) {
        super();
        
        this.maxConcurrency = maxConcurrency;
        this.strategy = StrategyFactory.create(strategy, options.strategyOptions);
        this.options = {
            autoStart: true,           // 是否自动开始调度
            scheduleInterval: 10,      // 调度检查间隔（毫秒）
            enableMetrics: true,       // 是否启用性能指标
            ...options
        };
        
        // 任务队列
        this.pendingTasks = [];       // 等待执行的任务
        this.runningTasks = new Map(); // 正在执行的任务 taskId -> TaskWrapper
        this.completedTasks = [];     // 已完成的任务（用于统计）
        
        // 状态管理
        this.isDestroyed = false;
        this.isPaused = false;
        this.isScheduling = false;
        
        // 性能统计
        this.metrics = {
            totalSubmitted: 0,
            totalCompleted: 0,
            totalFailed: 0,
            totalCancelled: 0,
            avgWaitTime: 0,
            avgExecutionTime: 0,
            maxWaitTime: 0,
            maxExecutionTime: 0
        };
        
        // 启动调度器
        if (this.options.autoStart) {
            this._startScheduler();
        }
        
        console.log(`🚀 动态并发池已创建 - 最大并发数: ${maxConcurrency}, 策略: ${this.strategy.getName()}`);
    }
    
    /**
     * 添加任务到池中
     * @param {Function} taskFunction 任务函数
     * @param {Object} options 任务选项
     * @return {Promise} 返回任务执行的Promise
     */
    addTask(taskFunction, options = {}) {
        if (this.isDestroyed) {
            throw new Error('Pool has been destroyed');
        }
        
        if (typeof taskFunction !== 'function') {
            throw new Error('taskFunction must be a function');
        }
        
        // 创建任务包装器
        const taskWrapper = new TaskWrapper(taskFunction, options);
        
        // 添加到等待队列
        this.pendingTasks.push(taskWrapper);
        this.metrics.totalSubmitted++;
        
        console.log(`📥 任务 ${taskWrapper.fnName} 已添加到队列，当前等待任务数: ${this.pendingTasks.length}`);
        
        // 触发调度
        this._triggerSchedule();
        
        // 监听任务完成事件
        taskWrapper.promise.then(() => {
            this._onTaskComplete(taskWrapper, 'completed');
        }).catch(() => {
            this._onTaskComplete(taskWrapper, 'failed');
        });
        
        this.emit('taskAdded', taskWrapper);
        
        return taskWrapper.promise;
    }
    
    /**
     * 获取池状态信息
     */
    getStatus() {
        return {
            strategy: this.strategy.getName(),
            maxConcurrency: this.maxConcurrency,
            pendingCount: this.pendingTasks.length,
            runningCount: this.runningTasks.size,
            completedCount: this.completedTasks.length,
            isPaused: this.isPaused,
            isDestroyed: this.isDestroyed,
            metrics: { ...this.metrics }
        };
    }
    
    /**
     * 暂停调度（不影响正在执行的任务）
     */
    pause() {
        this.isPaused = true;
        console.log('⏸️  并发池已暂停');
        this.emit('paused');
    }
    
    /**
     * 恢复调度
     */
    resume() {
        if (this.isPaused) {
            this.isPaused = false;
            console.log('▶️  并发池已恢复');
            this._triggerSchedule();
            this.emit('resumed');
        }
    }
    
    /**
     * 取消指定任务
     * @param {string} taskId 任务ID
     * @param {string} reason 取消原因
     */
    cancelTask(taskId, reason = 'Task cancelled by user') {
        // 在等待队列中查找
        const pendingIndex = this.pendingTasks.findIndex(task => task.id === taskId);
        if (pendingIndex !== -1) {
            const task = this.pendingTasks.splice(pendingIndex, 1)[0];
            task.cancel(reason);
            this.metrics.totalCancelled++;
            console.log(`❌ 任务 ${task.fnName} 已取消: ${reason}`);
            return true;
        }
        
        // 正在执行的任务无法取消
        if (this.runningTasks.has(taskId)) {
            console.warn(`⚠️  任务 ${taskId} 正在执行，无法取消`);
            return false;
        }
        
        console.warn(`⚠️  未找到任务 ${taskId}`);
        return false;
    }
    
    /**
     * 取消所有等待中的任务
     */
    cancelAllPending(reason = 'All pending tasks cancelled') {
        const cancelledCount = this.pendingTasks.length;
        this.pendingTasks.forEach(task => task.cancel(reason));
        this.pendingTasks = [];
        this.metrics.totalCancelled += cancelledCount;
        
        console.log(`❌ 已取消 ${cancelledCount} 个等待中的任务`);
        this.emit('allPendingCancelled', cancelledCount);
        
        return cancelledCount;
    }
    
    /**
     * 等待所有任务完成
     * @param {number} timeout 超时时间（毫秒）
     */
    async waitForAllTasks(timeout = 0) {
        const startTime = Date.now();
        
        while (this.pendingTasks.length > 0 || this.runningTasks.size > 0) {
            if (timeout > 0 && Date.now() - startTime > timeout) {
                throw new Error(`Timeout waiting for all tasks to complete after ${timeout}ms`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        console.log('✅ 所有任务已完成');
        this.emit('allTasksComplete');
    }
    
    /**
     * 销毁池（取消所有任务并清理资源）
     */
    async destroy() {
        if (this.isDestroyed) return;
        
        console.log('🛑 正在销毁并发池...');
        
        this.isDestroyed = true;
        this.cancelAllPending('Pool destroyed');
        
        // 等待正在执行的任务完成
        if (this.runningTasks.size > 0) {
            console.log(`⏳ 等待 ${this.runningTasks.size} 个正在执行的任务完成...`);
            await this.waitForAllTasks();
        }
        
        // 清理定时器
        if (this.scheduleTimer) {
            clearTimeout(this.scheduleTimer);
            this.scheduleTimer = null;
        }
        
        // 清理事件监听器
        this.removeAllListeners();
        
        console.log('💀 并发池已销毁');
        
        // 打印最终统计
        this._printFinalStats();
    }
    
    /**
     * 启动调度器
     */
    _startScheduler() {
        this._triggerSchedule();
    }
    
    /**
     * 触发调度检查
     */
    _triggerSchedule() {
        if (this.isScheduling || this.isPaused || this.isDestroyed) {
            return;
        }
        
        // 使用 setImmediate 确保异步执行
        this.scheduleTimer = setTimeout(() => this._schedule(), 0);
    }
    
    /**
     * 执行调度逻辑
     */
    async _schedule() {
        if (this.isScheduling || this.isPaused || this.isDestroyed) {
            return;
        }
        
        this.isScheduling = true;
        
        try {
            // 检查是否可以启动新任务
            while (this.runningTasks.size < this.maxConcurrency && 
                   this.pendingTasks.length > 0) {
                
                // 根据策略对待执行任务进行排序
                this.pendingTasks = this.strategy.sort(this.pendingTasks);
                
                // 取出下一个要执行的任务
                const nextTask = this.pendingTasks.shift();
                
                // 开始执行任务
                this._executeTask(nextTask);
            }
            
            // 如果队列为空，触发事件
            if (this.pendingTasks.length === 0 && this.runningTasks.size === 0) {
                this.emit('idle');
            }
            
        } catch (error) {
            console.error('调度过程中发生错误:', error);
            this.emit('error', error);
        } finally {
            this.isScheduling = false;
        }
    }
    
    /**
     * 执行单个任务
     */
    async _executeTask(taskWrapper) {
        // 将任务移到运行队列
        this.runningTasks.set(taskWrapper.id, taskWrapper);
        
        console.log(`🏃 开始执行任务 ${taskWrapper.fnName}，当前并发数: ${this.runningTasks.size}/${this.maxConcurrency}`);
        
        try {
            // 异步执行任务（不等待结果）
            taskWrapper.execute().catch(error => {
                // 错误会在任务包装器中处理
                console.error(`任务 ${taskWrapper.fnName} 执行出错:`, error.message);
            });
            
        } catch (error) {
            console.error(`启动任务 ${taskWrapper.fnName} 时出错:`, error);
        }
    }
    
    /**
     * 任务完成回调
     */
    _onTaskComplete(taskWrapper, status) {
        // 从运行队列移除
        this.runningTasks.delete(taskWrapper.id);
        
        // 添加到完成队列
        this.completedTasks.push(taskWrapper);
        
        // 更新统计
        if (status === 'completed') {
            this.metrics.totalCompleted++;
        } else if (status === 'failed') {
            this.metrics.totalFailed++;
        }
        
        // 更新性能指标
        if (this.options.enableMetrics) {
            this._updateMetrics(taskWrapper);
        }
        
        console.log(`✅ 任务 ${taskWrapper.fnName} ${status === 'completed' ? '完成' : '失败'}，当前并发数: ${this.runningTasks.size}/${this.maxConcurrency}`);
        
        this.emit('taskComplete', taskWrapper, status);
        
        // 触发下一轮调度
        this._triggerSchedule();
    }
    
    /**
     * 更新性能指标
     */
    _updateMetrics(taskWrapper) {
        const waitTime = taskWrapper.getWaitTime();
        const duration = taskWrapper.getDuration();
        
        if (waitTime !== null) {
            this.metrics.avgWaitTime = (this.metrics.avgWaitTime * (this.metrics.totalCompleted - 1) + waitTime) / this.metrics.totalCompleted;
            this.metrics.maxWaitTime = Math.max(this.metrics.maxWaitTime, waitTime);
        }
        
        if (duration !== null) {
            this.metrics.avgExecutionTime = (this.metrics.avgExecutionTime * (this.metrics.totalCompleted - 1) + duration) / this.metrics.totalCompleted;
            this.metrics.maxExecutionTime = Math.max(this.metrics.maxExecutionTime, duration);
        }
    }
    
    /**
     * 打印最终统计信息
     */
    _printFinalStats() {
        if (!this.options.enableMetrics) return;
        
        console.log('\n📊 并发池最终统计:');
        console.log('=====================================');
        console.log(`策略: ${this.strategy.getName()}`);
        console.log(`最大并发数: ${this.maxConcurrency}`);
        console.log(`总提交任务: ${this.metrics.totalSubmitted}`);
        console.log(`成功完成: ${this.metrics.totalCompleted}`);
        console.log(`执行失败: ${this.metrics.totalFailed}`);
        console.log(`用户取消: ${this.metrics.totalCancelled}`);
        console.log(`平均等待时间: ${this.metrics.avgWaitTime.toFixed(2)}ms`);
        console.log(`平均执行时间: ${this.metrics.avgExecutionTime.toFixed(2)}ms`);
        console.log(`最大等待时间: ${this.metrics.maxWaitTime}ms`);
        console.log(`最大执行时间: ${this.metrics.maxExecutionTime}ms`);
        console.log('=====================================\n');
    }
    
    // 便捷方法
    getPendingCount() { return this.pendingTasks.length; }
    getRunningCount() { return this.runningTasks.size; }
    getCompletedCount() { return this.completedTasks.length; }
    getTotalCount() { return this.metrics.totalSubmitted; }
    getAvailableSlots() { return this.maxConcurrency - this.runningTasks.size; }
}

module.exports = DynamicConcurrencyPool; 