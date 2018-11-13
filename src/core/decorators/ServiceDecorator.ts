import ServiceRegistry from "../ServiceRegistry";


export function Service(clazz: Function) {
  ServiceRegistry.register(clazz);
}

export function LocalService(clazz: Function) {
  ServiceRegistry.register(clazz, true);
}

const OPTIONAL_SERVICE = Symbol('OPTIONAL')

export function OptionalService(serviceNameOrTarget: any, key: string): any {
  return Reflect.defineMetadata(OPTIONAL_SERVICE, true, serviceNameOrTarget, key);
}


export function InjectService(serviceNameOrTarget?: any, key?: string): any {
  const apply = function (target: any, key: string): any {
    const type = Reflect.getMetadata("design:type", target, key);
    const typeName = typeof serviceNameOrTarget === 'string' ? serviceNameOrTarget : type.name;
    const optional = Reflect.getMetadata(OPTIONAL_SERVICE, target, key) || false;
    const prop = Reflect.getOwnPropertyDescriptor(target, key);
    // property getter
    var getter = function (): any {
      try {
        ServiceRegistry.get(typeName);
      } catch (e) {
        if (!optional) {
           throw new Error('Unable to load service : ' + typeName)
        }
        return null;
      }
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

// export const AsService = Service;
// export const AutoService = InjectService;