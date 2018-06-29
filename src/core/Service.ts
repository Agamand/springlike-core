import log4js from 'log4js';
import ConfigMgr from './ConfigMgr'
import path from 'path';
import fs from 'fs';
import Utils from './Utils';
import "reflect-metadata";
import RemoteService from './RemoteService';

const logger = log4js.getLogger(),
  appDir = path.dirname(require.main.filename);
export class ServiceRegistry {
  services: any = {}
  instance: any = {}
  load(regexp: RegExp | string, basefolder: string) {
    Utils.loadFiles(regexp, basefolder).forEach((service: Object) => {
      this.register(<Function>service);
    })
  }
  register(clazz: Function) {
    logger.info('load service :', clazz.name);
    this.services[clazz.name] = clazz
  }
  getClass<T extends Function=Function>(className: string): T {
    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }
    return <T>this.services[className];
  }

  get<T extends Object=Object>(className: string): T {
    const serviceConf = ConfigMgr.get('services', {});
    const remoteConf = ConfigMgr.get('remote', {
      enable: false
    });
    if (this.instance[className])
      return <T>this.instance[className];


    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }


    let instance = null;
    if (this.services[className].allowRemote && remoteConf.enable && !serviceConf[className]) {
      logger.debug('Instanciate remote', className);
      instance = Remote(className);
    } else {
      logger.debug('Instanciate', className);
      instance = new this.services[className]();

    }
    return <T>(this.instance[className] = instance)
  }
  preLoad(...serviceName: Array<string>) {
    let service2Preload: { [key: string]: boolean } = {}
    for (let key of serviceName) {
      service2Preload[key] = true;
    }

    logger.debug('Preload services');
    for (let serviceKey in this.services) {
      let service = this.services[serviceKey];
      if (service.preload || service2Preload[serviceKey])
        this.get(serviceKey);
    }
  }

}

const Service = new ServiceRegistry();

export default Service;



export function AsService(clazz: Function) {
  Service.register(clazz);
}


export function AutoService(serviceNameOrTarget?: any, key?: string): any {
  const apply = function (target: any, key: string): any {
    const type = Reflect.getMetadata("design:type", target, key);;
    const prop = Reflect.getOwnPropertyDescriptor(target, key);
    // property getter
    var getter = function () {
      return Service.get(type.name);
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
  if (typeof serviceNameOrTarget === 'string') {
    return apply;
  } else return apply(serviceNameOrTarget, key);
}



class ServiceProvider {

}

let Remote = (serviceName: string) => {
  const remoteService:RemoteService = Service.get("RemoteService")
  let serviceClass = Service.getClass(serviceName);
  let functions = Utils.getClassFunction(serviceClass);
  return new Proxy({}, {
    get: function (obj, target) {
      return function (...args: Array<any>) {
         return remoteService.getRemoteService(serviceName).then((serviceInfo) => {
           return remoteService.callRemoteService(serviceName, serviceInfo, target.toString(), args);
         });
      }
    }
  });
}