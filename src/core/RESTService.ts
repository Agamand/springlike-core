
import express, {
  Express
} from 'express';
import cookieSession from 'cookie-session'
import bodyParser from 'body-parser';
import ConfigMgr from './ConfigMgr';
import { Server } from 'http';
import Utils from './Utils';
import { RestBuilder } from './RESTBuilder';
import { logger, RESTCONTROLLER_META_KEY, METHOD_META_KEY, PATH_META_KEY, QUERY_PARAM_META_KEY, PATH_PARAM_META_KEY, HEADER_PARAM_META_KEY, BODY_META_KEY, CONTEXT_META_KEY } from './Constant';
import { AsService } from './decorators';
//import { registerRestPoint } from './RESTUtils';
const collection = 'cache';


@AsService
export default class RESTService {
  private app: Express;
  private server: Server;
  private tokens: any;
  constructor() {
    this.app = express();
    this.app.use(cookieSession({
      name: 'aga-session',
      keys: ['coucou'],
      // Cookie Options
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }))
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
      if (typeof entry == 'function') {
        if (entry.prototype) {
          let isRest: boolean = Reflect.getOwnMetadata(RESTCONTROLLER_META_KEY, entry.prototype);
          if (isRest) {
            this.loadRestController(entry);
          }
        }
        else
          entry();


      }
      else if (typeof entry == 'object') {
        for (let k in entry)
          entry[k]();
      }
    })
  }
  loadRestController(restController: Function) {
    let instance: any = new (<FunctionConstructor>restController)();

    let props = Object.getOwnPropertyNames(restController.prototype);

    const restPath = Reflect.getOwnMetadata(PATH_META_KEY, restController.prototype) || '/';
    for (let key of props) {
      const method = Reflect.getOwnMetadata(METHOD_META_KEY, restController.prototype, key.toString());
      if (!method)
        continue;
      const path = Reflect.getOwnMetadata(PATH_META_KEY, restController.prototype, key.toString());
      const queryParams = Reflect.getOwnMetadata(QUERY_PARAM_META_KEY, restController.prototype, key.toString());
      const pathParams = Reflect.getOwnMetadata(PATH_PARAM_META_KEY, restController.prototype, key.toString());
      const headerParams = Reflect.getOwnMetadata(HEADER_PARAM_META_KEY, restController.prototype, key.toString());
      const bodyIndex = Reflect.getOwnMetadata(BODY_META_KEY, restController.prototype, key.toString());
      const contextIndex = Reflect.getOwnMetadata(CONTEXT_META_KEY, restController.prototype, key.toString());

      let builder = new RestBuilder().method(method);
      let mapping: string[] = [];
      if (path)
        builder.path(restPath + path);
      if (queryParams) {
        for (let key in queryParams) {
          let queryParam = queryParams[key];
          builder.param('query', key, queryParam.optionnal, queryParam.index);
        }
      }
      if (pathParams) {
        for (let key in pathParams) {
          let pathParam = pathParams[key];
          builder.param('path', key, false, pathParam.index);
        }
      }
      if (undefined != bodyIndex && null != bodyIndex) {
        builder.body(bodyIndex);
      }
      if (undefined != contextIndex && null != contextIndex) {
        builder.contextParam(contextIndex);
      }
      builder.handler(instance[key]).secure(false).context(instance).build();
    }
  }
  fetch(method: string, path: string, handler: Function) {
    switch (method) {
      case 'POST':
      case 'post':
        return this.post(path, handler);
      case 'PUT':
      case 'put':
        return this.put(path, handler);
      case 'DELETE':
      case 'delete':
        return this.delete(path, handler);
      case 'GET':
      case 'get':
      default:
        return this.get(path, handler);
    }
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
