/**
 * 调度策略基类
 */
class ScheduleStrategy {
    /**
     * 对任务队列进行排序
     * @param {TaskWrapper[]} tasks 任务数组
     * @return {TaskWrapper[]} 排序后的任务数组
     */
    sort(tasks) {
        throw new Error('ScheduleStrategy.sort() must be implemented');
    }
    
    /**
     * 获取策略名称
     */
    getName() {
        throw new Error('ScheduleStrategy.getName() must be implemented');
    }
}

/**
 * FIFO策略：先进先出
 * 按照任务创建时间排序
 */
class FIFOStrategy extends ScheduleStrategy {
    sort(tasks) {
        return [...tasks].sort((a, b) => a.createdAt - b.createdAt);
    }
    
    getName() {
        return 'FIFO';
    }
}

/**
 * LPT策略：最长处理时间优先
 * 按照预期执行时间降序排列，长任务优先执行
 */
class LPTStrategy extends ScheduleStrategy {
    sort(tasks) {
        return [...tasks].sort((a, b) => {
            // 按预期耗时降序，耗时相同则按创建时间升序
            const durDiff = b.expectedDuration - a.expectedDuration;
            if (durDiff !== 0) return durDiff;
            return a.createdAt - b.createdAt;
        });
    }
    
    getName() {
        return 'LPT';
    }
}

/**
 * SPT策略：最短处理时间优先
 * 按照预期执行时间升序排列，短任务优先执行
 */
class SPTStrategy extends ScheduleStrategy {
    sort(tasks) {
        return [...tasks].sort((a, b) => {
            // 按预期耗时升序，耗时相同则按创建时间升序
            const durDiff = a.expectedDuration - b.expectedDuration;
            if (durDiff !== 0) return durDiff;
            return a.createdAt - b.createdAt;
        });
    }
    
    getName() {
        return 'SPT';
    }
}

/**
 * PRIORITY策略：优先级优先
 * 按照优先级降序排列，优先级高的优先执行
 */
class PriorityStrategy extends ScheduleStrategy {
    sort(tasks) {
        return [...tasks].sort((a, b) => {
            // 按优先级降序，优先级相同则按创建时间升序
            const priorityDiff = b.priority - a.priority;
            if (priorityDiff !== 0) return priorityDiff;
            return a.createdAt - b.createdAt;
        });
    }
    
    getName() {
        return 'PRIORITY';
    }
}

/**
 * WEIGHTED策略：加权调度
 * 综合考虑优先级、预期耗时和等待时间
 */
class WeightedStrategy extends ScheduleStrategy {
    constructor(options = {}) {
        super();
        this.priorityWeight = options.priorityWeight || 1.0;
        this.durationWeight = options.durationWeight || 0.5;
        this.waitTimeWeight = options.waitTimeWeight || 0.3;
    }
    
    sort(tasks) {
        const now = Date.now();
        
        return [...tasks].sort((a, b) => {
            // 计算加权分数
            const scoreA = this._calculateScore(a, now);
            const scoreB = this._calculateScore(b, now);
            
            // 分数高的优先执行
            const scoreDiff = scoreB - scoreA;
            if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
            return a.createdAt - b.createdAt;
        });
    }
    
    _calculateScore(task, now) {
        const waitTime = now - task.createdAt;
        const normalizedPriority = task.priority / 10; // 假设优先级范围0-10
        const normalizedDuration = task.expectedDuration / 10000; // 假设最大耗时10秒
        const normalizedWaitTime = waitTime / 60000; // 假设最大等待1分钟
        
        return (
            this.priorityWeight * normalizedPriority +
            this.durationWeight * normalizedDuration +
            this.waitTimeWeight * normalizedWaitTime
        );
    }
    
    getName() {
        return 'WEIGHTED';
    }
}

/**
 * 策略工厂
 */
class StrategyFactory {
    static strategies = {
        'FIFO': FIFOStrategy,
        'LPT': LPTStrategy,
        'SPT': SPTStrategy,
        'PRIORITY': PriorityStrategy,
        'WEIGHTED': WeightedStrategy
    };
    
    /**
     * 创建策略实例
     * @param {string|ScheduleStrategy} strategy 策略名称或策略实例
     * @param {object} options 策略选项
     * @return {ScheduleStrategy} 策略实例
     */
    static create(strategy, options = {}) {
        if (strategy instanceof ScheduleStrategy) {
            return strategy;
        }
        
        if (typeof strategy === 'string') {
            const StrategyClass = this.strategies[strategy.toUpperCase()];
            if (!StrategyClass) {
                throw new Error(`Unknown strategy: ${strategy}. Available: ${Object.keys(this.strategies).join(', ')}`);
            }
            return new StrategyClass(options);
        }
        
        throw new Error('Strategy must be a string name or ScheduleStrategy instance');
    }
    
    /**
     * 获取所有可用策略名称
     */
    static getAvailableStrategies() {
        return Object.keys(this.strategies);
    }
}

module.exports = {
    ScheduleStrategy,
    FIFOStrategy,
    LPTStrategy,
    SPTStrategy,
    PriorityStrategy,
    WeightedStrategy,
    StrategyFactory
}; 