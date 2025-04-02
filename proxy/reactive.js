// 创建一个简单的响应式系统
const {reactive, effect} = (() => {
    // 存储依赖关系
    const deps = new Map();
    // 当前正在执行的副作用函数
    let activeEffect = null;

    // 追踪依赖
    function track(target, key) {
        if (activeEffect) {
            let depsMap = deps.get(target);
            if (!depsMap) {
                deps.set(target, (depsMap = new Map()));
            }
            let dep = depsMap.get(key);
            if (!dep) {
                depsMap.set(key, (dep = new Set()));
            }
            dep.add(activeEffect);
        }
    }

    // 触发更新
    function trigger(target, key) {
        const depsMap = deps.get(target);
        if (!depsMap) return;
        
        const dep = depsMap.get(key);
        if (dep) {
            dep.forEach(effect => effect());
        }
    }

    // 创建响应式对象
    function reactive(obj) {
        return new Proxy(obj, {
            get(target, key, receiver) {
                const result = Reflect.get(target, key, receiver);
                // 依赖收集
                track(target, key);
                console.log(`[获取] 属性 "${key}" = ${result}`);
                return result;
            },
            set(target, key, value, receiver) {
                const oldValue = target[key];
                const result = Reflect.set(target, key, value, receiver);
                if (oldValue !== value) {
                    console.log(`[设置] 属性 "${key}" 从 ${oldValue} 变为 ${value}`);
                    // 触发更新
                    trigger(target, key);
                }
                return result;
            }
        });
    }

    // 创建副作用函数
    function effect(fn) {
        activeEffect = fn;
        fn();
        activeEffect = null;
    }

    return {
        reactive,
        effect
    };
})();

// 使用示例
const state = reactive({
    count: 0,
    message: 'Hello'
});

// 创建一个响应式效果
effect(() => {
    console.log(`当前计数: ${state.count}`);
});

effect(() => {
    console.log(`当前消息: ${state.message}`);
});

// 测试响应式更新
console.log('\n--- 开始更新测试 ---');
state.count++;  // 将触发第一个 effect
state.message = 'Hello World';  // 将触发第二个 effect

// 测试多次更新
console.log('\n--- 多次更新测试 ---');
state.count = 5;
state.message = '响应式系统工作正常！';

// 导出响应式系统
module.exports = reactive; 