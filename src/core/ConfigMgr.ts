import path from 'path'
import fs from 'fs';
import { LOGGER } from './Constant';
import { Utils } from './Utils';
const appDir = path.dirname(require.main.filename);


export const Config = (path: string, defaultValue?: any) => {
  return function (target: any, key: string): any {
    const type = Reflect.getMetadata("design:type", target, key);

    const prop = Reflect.getOwnPropertyDescriptor(target, key);
    // property getter
    var getter = function (): any {
      try {
        return ConfigMgr.get(path, defaultValue);
      } catch (e) {
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
}

export class ConfigMgr {
  static config: any = {}
  static mandatory: Array<string> = [
    //'discord.token', 'eve.api.client_id', 'eve.api.client_secret', 'eve.api.callback', 'eve.api.scope'
  ]
  private constructor() { }
  public static load(config: any) {
    if (typeof config == 'string') {
      let resolvedPath = path.resolve(appDir, config);
      LOGGER.debug(appDir, config, resolvedPath);
      let ext = path.extname(resolvedPath);
      switch (ext) {
        case '.js':
          let jsText = fs.readFileSync(resolvedPath).toString();
          eval(jsText);
          break;
        case '.json':
          let data = require(resolvedPath);
          if (data)
            ConfigMgr.load(data);
          break;
        default:
          LOGGER.debug('unsupported config file format :', ext);
      }


      return this;
    }
    Utils.merge(ConfigMgr.config, config);
    return this;
  }
  public static getConfig() {
    return this.config;
  }
  public static get(path: string, defaultValue?: any): any {
    defaultValue = defaultValue || null;
    let value = Utils.traverse(this.config, path);
    if (defaultValue && value && defaultValue.constructor.name === "Object" && value.constructor.name === "Object")
      return {
        ...defaultValue,
        ...value
      }
    return value || defaultValue;
  }
  public static set(path: string, value: any) {
    Utils.traverseAndSet(this.config, path, value);
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
          Utils.traverseAndSet(this.config, key, value);
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

}