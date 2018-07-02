import CacheService from "./CacheService";
import { URL } from "url";
import Service from "./Service";
import { METHOD_META_KEY, PATH_META_KEY, QUERY_PARAM_META_KEY, PATH_PARAM_META_KEY, HEADER_PARAM_META_KEY, BODY_META_KEY, logger } from "./Constant";
import { RequestBuilder } from "./RequestBuilder";
import request from 'request';

export interface IParamProvider {
  resolve(): Promise<any>
  getKey(): string;
}



export function createClient(baseUrl: string, clazz: Function, paramProvider?: IParamProvider, useCache: boolean = true) {

  const url: URL = new URL(baseUrl);
  const cacheService: CacheService = Service.get('CacheService');
  return new Proxy(clazz.prototype, {
    get: function (target: any, key: PropertyKey) {
      const method = Reflect.getOwnMetadata(METHOD_META_KEY, target, key.toString());
      const path = Reflect.getOwnMetadata(PATH_META_KEY, target, key.toString());
      const queryParam = Reflect.getOwnMetadata(QUERY_PARAM_META_KEY, target, key.toString());
      const pathParam = Reflect.getOwnMetadata(PATH_PARAM_META_KEY, target, key.toString());
      const headerParam = Reflect.getOwnMetadata(HEADER_PARAM_META_KEY, target, key.toString());
      const bodyIndex = Reflect.getOwnMetadata(BODY_META_KEY, target, key.toString());

      return async function (...args: Array<any>) {

        let cacheKey: string;
        if (paramProvider) {
          cacheKey = [method, paramProvider.getKey(), ...args].join('-');
        }
        else cacheKey = [].join('-')
        if (useCache) {
          try {
            return await cacheService.get(cacheKey);
          } catch (e) {
            logger.debug(e.toString())
          }
        }

        let injectedParam = await (paramProvider && paramProvider.resolve() || Promise.resolve({}));
        console.log('call proxied method', key, method, path, queryParam, pathParam)

        let requestBuilder = new RequestBuilder();
        requestBuilder.host(url.hostname);
        requestBuilder.protocol(url.protocol);

        if (method)
          requestBuilder.method(method);
        if (path)
          requestBuilder.path(path);

        if (queryParam) {
          for (let key in queryParam) {
            let index = queryParam[key];
            let value = args[index] || injectedParam[key];
            if (undefined !== value)
              requestBuilder.param('query', key, value);
          }
        }
        if (pathParam) {
          for (let key in pathParam) {
            let index = pathParam[key];
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
        if (bodyIndex) {
          let value = args[bodyIndex]
          if (undefined !== value)
            requestBuilder.body(args[bodyIndex])
        }
        let response: request.Response = await requestBuilder.build()();
        if (useCache) {
          cacheService.add(cacheKey, new Date(response.headers['expires']), response.body);
        }
        return response.body;
      }
    }
  })
}