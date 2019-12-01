import ServiceRegistry from "../ServiceRegistry";


export function Service(clazz: Function) {
  ServiceRegistry.register(clazz);
}

export function LocalService(clazz: Function) {
  ServiceRegistry.register(clazz, true);
}

export const SERVICE_TYPE = Symbol('SERVICE_TYPE')
const SECURITY_CHECK = Symbol('SECURITY_CHECK')
const OPTIONAL_SERVICE = Symbol('OPTIONAL')

export function OptionalService(serviceNameOrTarget: any, key: string): any {
  return Reflect.defineMetadata(OPTIONAL_SERVICE, true, serviceNameOrTarget, key);
}

export function serviceGenerator(target: any, key: any, typeName: string, context?: any) {
  const optional = Reflect.getMetadata(OPTIONAL_SERVICE, target, key) || false;
  const prop = Reflect.getOwnPropertyDescriptor(target, key);
  // property getter
  return function (): any {
    try {
      return ServiceRegistry.get(typeName, context);
    } catch (e) {
      if (!optional) {
        throw new Error('Unable to load service : ' + typeName)
      }
      return null;
    }
  };
}


export type SecurityCheck = (context: any) => boolean;

export function addSecurityCheck(target: any, key: any, check: SecurityCheck) {
  let checks = Reflect.getMetadata(SECURITY_CHECK, target, key) || []
  Reflect.defineMetadata(SECURITY_CHECK, [...checks, check], target, key);
}

export function getSecurityCheck(target: any, key: any): SecurityCheck[] {
  return Reflect.getMetadata(SECURITY_CHECK, target, key) || []
}


export function SecurityChecker(check: SecurityCheck) {
  return function (target: any, key: string) {
    return addSecurityCheck(target, key, check);
  }
}

export function InjectService(serviceNameOrTarget?: any, key?: string): any {

  const apply = function (target: any, key: string): any {
    const type = Reflect.getMetadata("design:type", target, key);
    let typeName = typeof serviceNameOrTarget === 'string' ? serviceNameOrTarget : type.name;
    Reflect.defineMetadata(SERVICE_TYPE, typeName, target, key);
    let getter = serviceGenerator(target, key, typeName);
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