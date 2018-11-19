import CacheService from "./CacheService";
import { URL } from "url";
import ServiceRegistry from "./ServiceRegistry";
import { LOGGER } from "./Constant";
import { RequestBuilder } from "./RequestBuilder";
import request from 'request';
import { PATH_META_KEY, QUERY_PARAM_META_KEY, PATH_PARAM_META_KEY, HEADER_PARAM_META_KEY, METHOD_META_KEY, SUCCESS_CODE_META_KEY, BODY_META_KEY } from "aga-rest-decorator";

export interface IParamProvider {
  resolve(): Promise<any>
  getKey(): string;
}

function injectClassArgument(builder: RequestBuilder, instance: any, injectedParam: any, queryParams: any, pathParams: any, headerParams: any) {

  for (let key in queryParams) {
    let queryParam = queryParams[key];
    builder.param('query', queryParam.key, injectedParam[key] || instance[key]);
  }
  for (let key in pathParams) {
    let pathParam = pathParams[key];
    builder.param('path', pathParam.key, injectedParam[key] || instance[key]);
  }
  for (let key in headerParams) {
    let headerParam = headerParams[key];
    builder.header(headerParam.key, headerParam.evaluate(injectedParam[key] || instance[key]));
  }
}


export function createClient(baseUrl: string, clazz: Function, paramProvider?: IParamProvider, useCache: boolean = true) {

  const instance = new (<FunctionConstructor>clazz)();
  const url: URL = new URL(baseUrl);
  const cacheService: CacheService = ServiceRegistry.get('CacheService');

  const pathClazz = Reflect.getMetadata(PATH_META_KEY, clazz.prototype) || '/';
  const queryParamClazz: any = {};
  const pathParamClazz: any = {}
  const headerParamClazz: any = {};
  let propDescriptors = Object.getOwnPropertyDescriptors(clazz.prototype);
  for (let key in propDescriptors) {

    if (propDescriptors[key].value && "function" == typeof propDescriptors[key].value)
      continue;

    if (Reflect.hasOwnMetadata(QUERY_PARAM_META_KEY, clazz.prototype, key.toString())) {
      queryParamClazz[key] = Reflect.getMetadata(QUERY_PARAM_META_KEY, clazz.prototype, key.toString())
    }
    if (Reflect.hasOwnMetadata(PATH_PARAM_META_KEY, clazz.prototype, key.toString())) {
      pathParamClazz[key] = Reflect.getMetadata(PATH_PARAM_META_KEY, clazz.prototype, key.toString())
    }
    if (Reflect.hasOwnMetadata(HEADER_PARAM_META_KEY, clazz.prototype, key.toString())) {
      headerParamClazz[key] = Reflect.getMetadata(HEADER_PARAM_META_KEY, clazz.prototype, key.toString())
    }
  }



  return new Proxy(instance, {
    get: function (target: any, key: PropertyKey) {

      const method = Reflect.getMetadata(METHOD_META_KEY, clazz.prototype, key.toString());
      if (!method || typeof target[key] != 'function') {
        return target[key];
      }


      const path = Reflect.getMetadata(PATH_META_KEY, clazz.prototype, key.toString()) || '/';
      const successCode = Reflect.getMetadata(SUCCESS_CODE_META_KEY, clazz.prototype, key.toString());
      const queryParam = Reflect.getMetadata(QUERY_PARAM_META_KEY, clazz.prototype, key.toString());
      const pathParam = Reflect.getMetadata(PATH_PARAM_META_KEY, clazz.prototype, key.toString());
      const headerParam = Reflect.getMetadata(HEADER_PARAM_META_KEY, clazz.prototype, key.toString());
      const bodyIndex = Reflect.getMetadata(BODY_META_KEY, clazz.prototype, key.toString());

      return async function (...args: Array<any>) {

        let cacheKey: string;
        if (paramProvider) {
          cacheKey = [key, paramProvider.getKey(), ...args].join('-');
        }
        else cacheKey = [key, ...args].join('-')
        if (useCache) {
          try {
            return await cacheService.get(cacheKey);
          } catch (e) {
            LOGGER.debug(e.toString())
          }
        }

        let injectedParam = await (paramProvider && paramProvider.resolve() || Promise.resolve({}));
        LOGGER.debug('call proxied method', key, method, path)

        let requestBuilder = new RequestBuilder();
        requestBuilder.host(url.hostname);
        requestBuilder.protocol(url.protocol);

        if (method)
          requestBuilder.method(method);

        requestBuilder.path(pathClazz + '/' + path);

        if (queryParam) {
          for (let key in queryParam) {
            let index = queryParam[key].index;
            let value = args[index] || injectedParam[key];
            if (undefined !== value)
              requestBuilder.param('query', key, value);
          }
        }
        if (pathParam) {
          for (let key in pathParam) {
            let index = pathParam[key].index;
            let value = args[index] || injectedParam[key];
            if (undefined !== value)
              requestBuilder.param('path', key, value);
          }
        }
        if (headerParam) {
          for (let key in headerParam) {
            let header = headerParam[key];
            let value = args[header.index] || injectedParam[key];
            if (undefined !== value) {
              requestBuilder.header(key, header.evaluate(value));
            }
          }
        }
        if (undefined != bodyIndex && null != bodyIndex) {
          let value = args[bodyIndex]
          if (undefined !== value)
            requestBuilder.body(args[bodyIndex])
        }
        if (undefined != successCode)
          requestBuilder.successCode(successCode);
        injectClassArgument(requestBuilder, target, injectedParam, queryParamClazz, pathParamClazz, headerParamClazz);

        let response: request.Response = await requestBuilder.build()();
        if (useCache) {
          cacheService.add(cacheKey, new Date(response.headers['expires']), response.body);
        }
        return response.body;
      }
    }
  })
}