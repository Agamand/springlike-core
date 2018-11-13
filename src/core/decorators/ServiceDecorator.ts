import Service from "../Service";


export function AsService(clazz: Function) {
  Service.register(clazz);
}


export function AutoService(serviceNameOrTarget?: any, key?: string): any {
  const apply = function (target: any, key: string): any {
    const type = Reflect.getMetadata("design:type", target, key);
    const prop = Reflect.getOwnPropertyDescriptor(target, key);
    // property getter
    var getter = function () {
      return Service.get(type.name);
    };

    // property setter
    var setter = function (newVal: any) {
    };
    // Create new property with getter and setter
    Object.defineProperty(target, key, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true
    });
  }
  if (typeof serviceNameOrTarget === 'string') {
    return apply;
  } else return apply(serviceNameOrTarget, key);
}