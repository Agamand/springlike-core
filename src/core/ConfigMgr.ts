import path from 'path'
import log4js from 'log4js';
import { LOGGER } from './Constant';
const appDir = path.dirname(require.main.filename);



export default class ConfigMgr {
  static config: any = {}
  static mandatory: Array<string> = [
    //'discord.token', 'eve.api.client_id', 'eve.api.client_secret', 'eve.api.callback', 'eve.api.scope'
  ]
  private constructor() { }
  public static load(config: any) {
    if (typeof config == 'string') {
      LOGGER.debug(appDir, config, path.resolve(appDir, config));
      let data = require(path.resolve(appDir, config));
      if (data)
        ConfigMgr.load(data);
      return this;
    }
    ConfigMgr.merge(ConfigMgr.config, config);
    return this;
  }
  public static get(path: string, defaultValue?: any): any {
    defaultValue = defaultValue || null;
    let value = this.traverse(path);
    if (defaultValue && value && defaultValue.constructor.name === "Object" && value.constructor.name === "Object")
      return {
        ...defaultValue,
        ...value
      }
    return value || defaultValue;
  }
  public static set(path: string, value: any) {
    this.traverseAndSet(path, value);
  }
  public static parse(args: string[]) {
    let iterator = args[Symbol.iterator]();
    for (let r; !(r = iterator.next()).done;) {
      let value = r.value;
      LOGGER.debug('parse %s %s', value, typeof value)

      if ('-c' === value || '--config' === value) {
        if (!(r = iterator.next()).done) {
          let cpath = r.value;
          if (!path.isAbsolute(r.value))
            cpath = path.join(process.cwd(), cpath)
          ConfigMgr.load(cpath);
        }
      }

      if (value.startsWith('-D')) {
        let key = value.substring(2);
        if (!(r = iterator.next()).done) {
          value = r.value;
          this.traverseAndSet(key, value);
        }
      }
    }
    return this;
  }
  public static validate() {
    var error = [];
    for (let option of ConfigMgr.mandatory) {
      let value = ConfigMgr.get(option);
      if (!value) {
        error.push(option);
      }
    }
    if (error.length) {
      throw new Error('Following options are not set : ' + error.join(', '))
    }
  }
  public static merge(dest: any, cfg: any) {
    var me = this;
    if (cfg instanceof Object) {
      for (var i in cfg) {
        if (cfg[i] instanceof Object && !(cfg[i] instanceof Array) && !(typeof cfg[i] == 'function')) {
          if (!dest[i])
            dest[i] = {};
          ConfigMgr.merge(dest[i], cfg[i]);
        } else {
          dest[i] = cfg[i];
        }
      }
    }
  }
  public static traverse(path: string) {
    var tmp = this.config;
    const pathPart = path.split('.');
    for (var i = 0, len = pathPart.length; i < len && tmp; i++)
      tmp = tmp[pathPart[i]];
    return tmp;
  }
  public static traverseAndSet(path: string, value: any) {
    var tmp = this.config;
    const pathPart = path.split('.');
    var i = 0,
      len = pathPart.length - 1;
    for (; i < len && tmp; i++) {
      tmp = tmp[pathPart[i]] || (tmp[pathPart[i]] = {});

    }
    return tmp[pathPart[len]] = value;

  }
}