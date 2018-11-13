import ConfigMgr from './ConfigMgr'
import path from 'path';
import fs from 'fs';
import Utils from './Utils';
import "reflect-metadata";
import RemoteService from './RemoteService';
import { LOGGER } from './Constant';

const appDir = path.dirname(require.main.filename);
export class ServiceRegistry {
  services: any = {}
  instance: any = {}
  load(regexp: RegExp | string, basefolder: string) {
    Utils.loadFiles(regexp, basefolder).forEach((service: Object) => {
      this.register(<Function>service);
    })
  }
  register(clazz: Function) {
    LOGGER.info('load service :', clazz.name);
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
      LOGGER.debug('Instanciate remote', className);
      instance = Remote(className);
    } else {
      LOGGER.debug('Instanciate', className);
      instance = new this.services[className]();

    }
    return <T>(this.instance[className] = instance)
  }
  preLoad(...serviceName: Array<string>) {
    let service2Preload: { [key: string]: boolean } = {}
    for (let key of serviceName) {
      service2Preload[key] = true;
    }

    LOGGER.debug('Preload services');
    for (let serviceKey in this.services) {
      let service = this.services[serviceKey];
      if (service.preload || service2Preload[serviceKey])
        this.get(serviceKey);
    }
  }

}

const Service = new ServiceRegistry();

export default Service;


let Remote = (serviceName: string) => {
  const remoteService: RemoteService = Service.get("RemoteService")
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