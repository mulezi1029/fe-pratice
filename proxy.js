function logProxy(o, objname) {
  const handlers = {
    get(target, prop, receiver) {
      console.log(`Getting ${objname}.${prop}`);
      let value = Reflect.get(target, prop, receiver);
      // If the value is an object or function of the target own key, return a proxy for that object
      if(Reflect.ownKeys(target).includes(prop) && (typeof value === 'object' || typeof value === 'function')) {
        return new Proxy(value, logProxy(value, `${objname}.${prop}`));
      }
      // else return the value
      return value;
    },
    set(target, prop, value, receiver) {
      console.log(`Setting ${objname}.${prop} value to ${value}`);
      return Reflect.set(target, prop, value, receiver);
    },
    apply(target, thisArg, argumentsList) { 
      console.log(`function calling: ${objname}(${argumentsList})`);
      return Reflect.apply(target, thisArg, argumentsList);
    },
    construct(target, argumentsList, newTarget) { 
      console.log(`constructing calling: ${objname}(${argumentsList})`);
      return Reflect.construct(target, argumentsList, newTarget);
    }
  }
  Reflect.ownKeys(o).forEach(handler => {
    if (!(handler in handlers)) {
      handlers[handler] = function (target, ...args) {
        console.log(`Calling ${handler}(${objname}, ${args})`);
        return Reflect[handler](target, ...args);
      }
    }
  });

  return new Proxy(o, handlers);
}

const arr = [1, 2, 3]
const method = {
  square: function (x) { 
    return x * x;
  }
}
const arrProxy = logProxy(arr, 'arr');
const methodProxy = logProxy(method, 'method');
console.log(111)
console.log(arrProxy.map(method.square))
