
import express, {
  Express
} from 'express';
import bodyParser from 'body-parser';
import ConfigMgr from './ConfigMgr';
import { Server } from 'http';
import Utils from './Utils';
import { AsService } from '..';
import { RestBuilder } from './RESTBuilder';
import { logger } from './Constant';
const collection = 'cache';


@AsService
export default class RESTService {
  private app: Express;
  private server: Server;
  private tokens: any;
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

  }
}