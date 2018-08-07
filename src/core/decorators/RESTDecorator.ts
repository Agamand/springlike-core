import { PATH_PARAM_META_KEY, QUERY_PARAM_META_KEY, HEADER_PARAM_META_KEY, BODY_META_KEY, METHOD_META_KEY, PATH_META_KEY, RESTCONTROLLER_META_KEY, CONTEXT_META_KEY } from "../Constant";


export function PathParam(key: string) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    const current = Reflect.getOwnMetadata(PATH_PARAM_META_KEY, target, propertyKey) || {};
    current[key] = parameterIndex
    Reflect.defineMetadata(PATH_PARAM_META_KEY, current, target, propertyKey);
  }
}
export function QueryParam(key: string, optionnal: boolean = false) {
  return function (target: Object, propertyKey: string | symbol, index: number) {

    const current = Reflect.getOwnMetadata(QUERY_PARAM_META_KEY, target, propertyKey) || {};
    current[key] = { index, optionnal }
    Reflect.defineMetadata(QUERY_PARAM_META_KEY, current, target, propertyKey);
  }
} export function HeaderParam(key: string, value: Function = (value: any) => { return value; }) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {

    const current = Reflect.getOwnMetadata(HEADER_PARAM_META_KEY, target, propertyKey) || {};
    current[key] = { index: parameterIndex, evaluate: value };
    Reflect.defineMetadata(HEADER_PARAM_META_KEY, current, target, propertyKey);
  }
}
export function Body(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  Reflect.defineMetadata(BODY_META_KEY, parameterIndex, target, propertyKey);
}

export function Context(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  Reflect.defineMetadata(CONTEXT_META_KEY, parameterIndex, target, propertyKey);
}

export function AuthBearer() {
  return HeaderParam('Authorization', (value: any) => { return `Bearer ${value} ` })
}

export const Method = function (method: string) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(METHOD_META_KEY, method, target, key);
  }
}
export const GET = Method('GET');
export const POST = Method('POST');
export const PUT = Method('PUT');
export const DELETE = Method('DELETE');



export const Path = function (path: string) {
  return function (...args: Array<any>) {
    if (typeof args[0] == "function") {
      const clazz: Function = args[0];
      Reflect.defineMetadata(PATH_META_KEY, path, clazz.prototype);
    } else {
      const target: any = args[0], key: string = args[1], descriptor: PropertyDescriptor = args[2];
      Reflect.defineMetadata(PATH_META_KEY, path, target, key);
    }
  }
}

export const RestController = function (clazz: Function) {
  Reflect.defineMetadata(RESTCONTROLLER_META_KEY, true, clazz.prototype);
}