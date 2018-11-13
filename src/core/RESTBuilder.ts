
import { Request, Response } from 'express';
import { LOGGER } from './Constant';
import ServiceRegistry from './ServiceRegistry';
import Utils from './Utils';
import Path from 'path';

const validateQuery = function (requestParam: any, params: Param) {

  for (let key in params.query) {
    let param = params.query[key];
    //if a query or path param and there no value
    if (!(key in requestParam.query) && !param.optionnal) {
      LOGGER.debug(key, "query", 'not found');
      return false;
    }

  }
  for (let key in params.path) {
    let param = params.path[key];
    //if a path param and there no value
    if (!(key in requestParam.path) && !param.optionnal) {
      LOGGER.debug(key, "path", 'not found');
      return false;
    }

  }
  if (params.body && !requestParam.body) {
    LOGGER.debug('body is required');
    return false;
  }
  return true;
}




const getParams = function (requestParam: any, params: Param, functionParams: string[]) {
  let result: any[] = [];

  let functionParamsMap = functionParams.reduce((map: any, name, i) => {
    map[name] = i;
    return map;
  }, {});

  //map query param
  for (let key in params.query) {
    let queryParam = params.query[key];
    let mappingKey: number = typeof queryParam.mappingKey == 'number' ? queryParam.mappingKey : functionParamsMap[queryParam.mappingKey];
    result[mappingKey] = requestParam.query[key];
  }
  //map path param
  for (let key in params.path) {
    let pathParam = params.path[key];
    let mappingKey: number = typeof pathParam.mappingKey == 'number' ? pathParam.mappingKey : functionParamsMap[pathParam.mappingKey];
    result[mappingKey] = requestParam.path[key];
  }
  //map body
  if (undefined !== params.body && null !== params.body) {
    let bodyParam = params.body;
    let mappingKey: number = typeof bodyParam == 'number' ? bodyParam : functionParamsMap[bodyParam];
    result[mappingKey] = requestParam.body;
  }
  //map context
  if (undefined !== params.context && null !== params.context) {
    let contextParam = params.context;
    let mappingKey: number = typeof contextParam == 'number' ? contextParam : functionParamsMap[contextParam];
    result[mappingKey] = requestParam.context;
  }


  return result;
}

const wrapHandler = function (builder: RestBuilder) {
  const rest: any = ServiceRegistry.get('RESTService')
  return function (req: Request, res: Response) {
    let query = req && req.query || {};
    if (builder._secure && !rest.isAllowedToken(query.token)) {
      res.status(403).end();
      return;
    }
    let requestParam = {
      context: {
        request: req,
        response: res,
        status: builder._successCode,
        redirect: (url: string) => {
          requestParam.context.status = 301
          res.setHeader('Location', url)
        }
      },
      path: req.params || {},
      query: req.query || {},
      body: req.body || null
    }
    if (!validateQuery(requestParam, builder._params)) {
      LOGGER.debug('query not valid');
      res.status(400).end();
      return;
    }
    let functionParams = Utils.getFunctionParams(builder._handler) || [];
    let result = builder._handler.apply(builder._context, getParams(requestParam, builder._params, functionParams));
    if (!(result instanceof Promise)) {
      result = Promise.resolve(result);
    }
    result.then((data: any) => {
      if (null === data) {
        LOGGER.debug('no data');
        res.status(404).end();
        return;
      }
      if (query.format && Renderer[query.format]) {
        data = Renderer[query.format](data);
        res.type(Renderer[query.format].contentType);
      }
      res.status(requestParam.context.status)
      if (data)
        res.send(data);
      else res.end();
    }).catch((e: Error) => {
      LOGGER.error("REST Call got an error :", e)
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


interface Param {
  [key: string]: any;
  query: { [key: string]: { optionnal: boolean, mappingKey: number | string } };
  path: { [key: string]: { optionnal: boolean, mappingKey: number | string } };
  body?: string;
  context?: string;
}


export class RestBuilder {
  _path: string = "/";
  _method: string = 'get';
  _secure: boolean = true;
  _handler: Function = function () { };
  _params: Param = { query: {}, path: {} };
  _context: any = null;
  _successCode: number = 200;
  constructor() {
  }
  path(path: string): RestBuilder {
    this._path = Path.normalize(path).replace(/\\\\|\\/g, '/');
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
  /**
   * 
   * @param type 
   * @param name 
   * @param optionnal 
   */
  param(type: "path" | "query", name: string, optionnal: boolean = false, mappingKey = name): RestBuilder {
    this._params[type][name] = { optionnal, mappingKey };
    return this;
  }
  body(mappingKey: string) {
    this._params["body"] = mappingKey;
    return this;
  }
  contextParam(mappingKey: string) {
    this._params["context"] = mappingKey;
    return this;
  }
  context(context: any): RestBuilder {
    this._context = context;
    return this;
  }
  successCode(successCode: number) {
    this._successCode = successCode;
    return this;
  }
  build(): void {
    const rest: any = ServiceRegistry.get('RESTService')


    let handler = wrapHandler(this);
    rest.fetch(this._method, this._path, handler);
  }
}
