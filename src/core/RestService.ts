
import express, {
  Express, Response
} from 'express';
import bodyParser from 'body-parser';
import log4js from 'log4js';
import crypto from 'crypto';
import ConfigMgr from './ConfigMgr';
import { Server } from 'http';
import Utils from './Utils';
import { PathParams, Request } from 'express-serve-static-core';
import Service, { AsService } from './Service';
import request, * as RequestModule from 'request';
import { resolve, URL } from 'url';
import { rejects } from 'assert';
const collection = 'cache',
  logger = log4js.getLogger();


@AsService
export default class RESTService {
  app: Express;
  server: Server;
  tokens: any;
  constructor() {
    this.app = express();
    this.app.use(bodyParser.json())
    this.server = this.app.listen(this.getPort(), function () { })
    this.tokens = {};
    let serverToken = ConfigMgr.get('rest.token');
    if (serverToken)
      this.tokens[serverToken] = true;
  }
  getHost() {
    return ConfigMgr.get('rest.host', 'localhost');
  }
  getPort() {
    return ConfigMgr.get('rest.port', '3010');
  }
  getPublicPort() {
    return ConfigMgr.get('rest.publicPort', this.getPort());
  }
  getProtocol() {
    return ConfigMgr.get('rest.protocol', 'http');
  }
  loadRESTPoint(regexp: RegExp, baseDir: string) {
    Utils.loadFiles(regexp, baseDir).forEach((entry: any) => {
      if (typeof entry == 'function')
        entry();
      else if (typeof entry == 'object') {
        for (let k in entry)
          entry[k]();
      }
    })
  }
  get(path: string, handler: Function) {
    logger.debug('REST register method: GET, path:', path);
    this.app.get(path, (...args: Array<any>) => {
      logger.debug('REST call method: GET path:', path);
      return handler.apply(null, args);
    });
  }
  post(path: string, handler: Function) {
    logger.debug('REST register method: POST, path:', path);
    this.app.post(path, (...args: Array<any>) => {
      logger.debug('REST call method: POST, path:', path);
      return handler.apply(null, args);
    });
  }
  put(path: string, handler: Function) {
    logger.debug('REST register method: PUT, path:', path);
    this.app.put(path, (...args: Array<any>) => {
      logger.debug('REST call method: PUT, path:', path);
      return handler.apply(null, args);
    });
  }
  delete(path: string, handler: Function) {
    logger.debug('REST register method: DELETE, path:', path);
    this.app.delete(path, (...args: Array<any>) => {
      logger.debug('REST call method: DELETE, path:', path);
      return handler.apply(null, args);
    });
  }
  createTemporyToken(time: number) {
    time = time || 60;
    let token = Utils.generateRandomId();
    setTimeout(() => {
      delete this.tokens[token];
    }, time * 1000);
    this.tokens[token] = true;
    return token;
  }
  isAllowedToken(token: string) {
    return this.tokens[token] && true || false;
  }
  builder() {
    return new RestBuilder();
  }
  createURL(path: string) {
    let protocol = this.getProtocol(),
      host = this.getHost(),
      port = this.getPublicPort();
    port = protocol == 'http' && port == 80 || protocol == 'https' && port == 443 ? "" : ":" + port;

    return `${protocol}://${host}${port}${path}`
  }
}




const QUERY_OR_PATH = {
  path: 1,
  query: 1
};
const validateQuery = function (requestParam: any, params: any) {
  for (let key in params) {
    let type = params[key];
    //if a query or path param and there no value
    if (!(key in requestParam[type]) && (type in QUERY_OR_PATH)) {

      logger.debug(key, type, 'not found in param', requestParam);
      return false;
    }
    if (type == 'body' && !requestParam.body) {
      logger.debug('body is required');
    }
  }
  return true;
}
const getParamValue = function (type: string, name: string, requestParam: any) {
  if (type == 'body' || type == 'context')
    return requestParam[type] || null;

  return requestParam[type] && requestParam[type][name] || null;
}

const getParams = function (requestParam: any, params: any, functionParams: any) {
  let result = [];
  for (let param of functionParams) {
    result.push(getParamValue(params[param], param, requestParam));
  }
  return result;
}
const wrapHandler = function (handler: Function, params: any, context: any, secure: boolean) {
  const rest: RESTService = Service.get('RESTService')
  return function (req: Request, res: Response) {
    let query = req && req.query || {};
    if (secure && !rest.isAllowedToken(query.token)) {
      res.status(403).end();
      return;
    }
    let requestParam = {
      context: req,
      path: req.params || {},
      query: req.query || {},
      body: req.body || {}
    }
    if (!validateQuery(requestParam, params)) {

      logger.debug('query not valid');
      res.status(400).end();
      return;
    }
    let functionParams = Utils.getFunctionParams(handler);
    let result = handler.apply(context, getParams(requestParam, params, functionParams));
    if (!(result instanceof Promise)) {
      result = Promise.resolve(result);
    }
    result.then((data: any) => {
      if (null === data) {
        logger.debug('no data');
        res.status(404).end();
        return;
      }
      if (query.format && Renderer[query.format]) {
        data = Renderer[query.format](data);
        res.type(Renderer[query.format].contentType);
      }
      res.send(data);
    }).catch((e: Error) => {
      res.status(500).end();
    });
  }
}

const Renderer: any = {}
Renderer.text = function (data: any) {
  if (!(data instanceof Array)) {
    data = [data];
  }
  let buffer = [];
  let keys = Object.keys(data[0]);
  buffer.push(keys.join('\t'));
  for (let entry of data) {
    let line = [];
    for (let k of keys) {
      line.push(entry[k]);
    }
    buffer.push(line.join('\t'));
  }
  buffer.push(' ');
  return buffer.join('\n')
}
Renderer.text.contentType = "text"



export class RestBuilder {
  _path: string = "/";
  _method: string = 'get';
  _secure: boolean = true;
  _handler: Function = function () { };
  _params: any = {};
  _context: any = null;
  constructor() {
  }
  path(path: string): RestBuilder {
    this._path = path;
    return this;
  }
  method(method: string): RestBuilder {
    this._method = method;
    return this;
  }
  secure(secure: boolean): RestBuilder {
    this._secure = secure;
    return this;
  }
  handler(handler: Function): RestBuilder {
    this._handler = handler;
    return this;
  }
  param(type: string, name: string): RestBuilder {
    this._params[name] = type;
    return this;
  }
  context(context: any): RestBuilder {
    this._context = context;
    return this;
  }
  build(): void {
    const rest: any = Service.get('RESTService')
    let handler = wrapHandler(this._handler, this._params, this._context, this._secure);
    rest[this._method](this._path, handler)
  }
}

export class RequestBuilder {
  _host: string = 'localhost';
  _protocol: string = 'http'
  _path: string = "/";
  _method: string = 'GET';
  _secure: boolean = true;
  _header: any = {};
  _handler: Function = function () { };
  _params: any = {};
  _context: any = null;
  constructor() {
  }
  protocol(protocol: string): RequestBuilder {
    this._protocol = protocol.replace(/:/, '');

    return this;
  }
  host(host: string): RequestBuilder {
    this._host = host;
    return this;
  }
  header(key: string, value: string): RequestBuilder {
    this._header[key] = value;
    return this;
  }
  path(path: string): RequestBuilder {
    this._path = path;
    return this;
  }
  method(method: string): RequestBuilder {
    this._method = method;
    return this;
  }
  secure(secure: boolean): RequestBuilder {
    this._secure = secure;
    return this;
  }
  handler(handler: Function): RequestBuilder {
    this._handler = handler;
    return this;
  }
  param(type: string, name: string, value: any): RequestBuilder {
    this._params[type] = this._params[type] || {};
    this._params[type][name] = value;
    return this;
  }
  body(value: any) {
    this._params["body"] = value;
    return this;
  }
  context(context: any): RequestBuilder {
    this._context = context;
    return this;
  }
  computePath(): string {
    let path = this._path;
    if (this._params.path) {
      for (let key in this._params.path) {
        path = path.replace(`:${key}`, this._params.path[key]);
      }
    }
    let queryPath = '';
    if (this._params.query) {
      let query = [];
      for (let key in this._params.query) {
        query.push(`${key}=${this._params.query[key]}`)
      }
      queryPath = '?' + query.join('&');
    }
    return path + queryPath;
  }

  build(): Function {
    const me = this;
    return function () {
      return new Promise((resolve: Function, reject: Function) => {
        const url = `${me._protocol}://${me._host}${me.computePath()}`;
        console.log('call request on ', url, me._host, me._path);

        request({
          method: me._method,
          url: url,
          headers: me._header,
          body: me._params["body"] || null,
          json: true
        }, function (error: any, response: request.Response, body: any) {
          if (error) {
            return reject(error);
          }
          if (200 != response.statusCode) {
            return reject('got a ' + response.statusCode + ' status code');
          }
          resolve(body);
        })
      });
    }
  }
}

const pathParamMetadataKey = Symbol("rest:pathParam");
const queryParamMetadataKey = Symbol("rest:queryParam");
const headerParamMetadataKey = Symbol("rest:headerParam");
const bodyMetadataKey = Symbol("rest:body");
const methodMetadataKey = Symbol("rest:method");
const pathMetadataKey = Symbol("rest:path");
export function PathParam(key: string) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    console.log('call PathParam', propertyKey);
    const current = Reflect.getOwnMetadata(pathParamMetadataKey, target, propertyKey) || {};
    current[key] = parameterIndex
    Reflect.defineMetadata(pathParamMetadataKey, current, target, propertyKey);
  }
}
export function QueryParam(key: string) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    console.log('call QueryParam', propertyKey);
    const current = Reflect.getOwnMetadata(queryParamMetadataKey, target, propertyKey) || {};
    current[key] = parameterIndex
    Reflect.defineMetadata(queryParamMetadataKey, current, target, propertyKey);
  }
} export function HeaderParam(key: string, value: Function = (value: any) => { return value; }) {
  return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
    console.log('call QueryParam', propertyKey);
    const current = Reflect.getOwnMetadata(headerParamMetadataKey, target, propertyKey) || {};
    current[key] = { index: parameterIndex, evaluate: value };
    Reflect.defineMetadata(headerParamMetadataKey, current, target, propertyKey);
  }
}
export function Body(target: Object, propertyKey: string | symbol, parameterIndex: number) {
  Reflect.defineMetadata(bodyMetadataKey, parameterIndex, target, propertyKey);
}

export function AuthBearer() {
  return HeaderParam('Authorization', (value: any) => { return `Bearer ${value}` })
}

export const Method = function (method: string) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    console.log('call Method', target, key);
    Reflect.defineMetadata(methodMetadataKey, method, target, key);
  }
}
export const GET = Method('GET');
export const POST = Method('POST');
export const PUT = Method('PUT');
export const DELETE = Method('DELETE');



export const Path = function (path: string) {
  return function (...args: Array<any>) {
    if (typeof args[0] == "function") {
      console.log('apply path on class');
      const clazz: Function = args[0];
    } else {
      const target: any = args[0], key: string = args[1], descriptor: PropertyDescriptor = args[2];
      console.log('apply path on method', target, key);
      Reflect.defineMetadata(pathMetadataKey, path, target, key);
    }
  }
}

export const RestController = function (clazz: Function) {
  //overload ctor and inject rest endpoint
}


export interface IParamProvider {
  resolve(): Promise<any>
}

export interface ICacheProvider {
  get(): Promise<any>
}


export function createClient(baseUrl: string, clazz: Function, paramProvider?: IParamProvider, useCache: boolean = true) {

  const url: URL = new URL(baseUrl);
  return new Proxy(clazz.prototype, {
    get: function (target: any, key: PropertyKey) {
      console.log(Reflect.getOwnMetadataKeys(target, key.toString()));
      const method = Reflect.getOwnMetadata(methodMetadataKey, target, key.toString());
      const path = Reflect.getOwnMetadata(pathMetadataKey, target, key.toString());
      const queryParam = Reflect.getOwnMetadata(queryParamMetadataKey, target, key.toString());
      const pathParam = Reflect.getOwnMetadata(pathParamMetadataKey, target, key.toString());
      const headerParam = Reflect.getOwnMetadata(headerParamMetadataKey, target, key.toString());
      const bodyIndex = Reflect.getOwnMetadata(bodyMetadataKey, target, key.toString());

      return function (...args: Array<any>) {
        let injectedParam = paramProvider && paramProvider.resolve() || Promise.resolve({});
        console.log('call proxied method', key, method, path, queryParam, pathParam)
        return injectedParam.then((injectedParam) => {
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
              if (args.length > index)
                requestBuilder.param('query', key, args[index] || injectedParam[key]);
            }
          }
          if (pathParam) {
            for (let key in pathParam) {
              let index = pathParam[key];
              if (args.length > index)
                requestBuilder.param('path', key, args[index] || injectedParam[key]);
            }
          }
          if (headerParam) {
            for (let key in headerParam) {
              let header = headerParam[key];
              if (args.length > header.index) {
                let value = args[header.index] || injectedParam[key];
                requestBuilder.header(key, value && header.evaluate(value));
              }
            }
          }
          if (bodyIndex) {
            requestBuilder.body(args[bodyIndex])
          }
          return requestBuilder.build()();
        })
      }
    }
  })
}




//RESTService.preload = true;
