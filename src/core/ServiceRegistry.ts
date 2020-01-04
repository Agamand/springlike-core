import { ConfigMgr } from './ConfigMgr'
import path from 'path';
import fs from 'fs';
import { Utils } from './Utils';
import "reflect-metadata";
//import RemoteService from './RemoteService';
import { LOGGER } from './Constant';
import { SMap } from './CommonTypes';
import { SERVICE_TYPE, serviceGenerator, getSecurityCheck, NO_SECURITY } from './decorators/ServiceDecorator';
const appDir = path.dirname(require.main.filename);
const CONTEXT_PROP = "context";

export class InvalidAccessError extends Error { }

export function wrapContext<T>(object: any, context: any) {
  return <T>new Proxy(object, {
    get: function (target, key) {
      let serviceType = Reflect.getMetadata(SERVICE_TYPE, target, <any>key);
      let noSecurity = Reflect.getMetadata(NO_SECURITY, target.constructor);
      if (noSecurity)
        context = { ...context, noSecurity: !!noSecurity }
      if (CONTEXT_PROP === key && context)
        return context;
      else if (serviceType) {
        return serviceGenerator(target, key, serviceType, context)();
      }
      let checks = getSecurityCheck(target, key);
      if (context && !context.noSecurity && checks.length && context)
        for (const check of checks) {
          if (!check(context))
            throw new InvalidAccessError('invalid access');
        }
      return target[key];
    }
  })
}

export interface ServiceProvider {

  hasService(className: string): any;
  getService(className: string): any;

}


class LocalServiceProvider {



}


export class CServiceRegistry {
  services: SMap<any> = {}
  instance: SMap<any> = {}
  localService: SMap<boolean> = {}
  serviceProvider: ServiceProvider[] = [];
  load(regexp: RegExp | string, basefolder: string) {
    Utils.loadFiles(regexp, basefolder).forEach((service: Object) => {
      this.register(<Function>service);
    })
  }
  register(clazz: Function, local: boolean = false) {
    LOGGER.info('load service :', clazz.name);
    this.services[clazz.name] = clazz
    this.localService[clazz.name] = local
  }
  getClass<T extends Function = Function>(className: string): T {
    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }
    return <T>this.services[className];
  }

  get<T extends Object = Object>(className: string, context?: any): T {
    const serviceConf = ConfigMgr.get('services', {});
    const remoteConf = ConfigMgr.get('remote', {
      enable: false
    });

    if (this.instance[className])
      return wrapContext(this.instance[className], context);


    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }


    let instance = null;
    // if (this.services[className].allowRemote && remoteConf.enable && !serviceConf[className]) {
    //   LOGGER.debug('Instanciate remote', className);
    //   instance = Remote(className);
    // } else
    {
      LOGGER.debug('Instanciate', className);
      instance = new this.services[className]();
    }
    return wrapContext(this.instance[className] = instance, context);
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

const ServiceRegistry = new CServiceRegistry();

export default ServiceRegistry;





// let Remote = (serviceName: string) => {
//   const remoteService: RemoteService = ServiceRegistry.get("RemoteService")
//   let serviceClass = ServiceRegistry.getClass(serviceName);
//   let functions = Utils.getClassFunction(serviceClass);
//   return new Proxy({}, {
//     get: function (obj, target) {
//       return function (...args: Array<any>) {
//         return remoteService.getRemoteService(serviceName).then((serviceInfo) => {
//           return remoteService.callRemoteService(serviceName, serviceInfo, target.toString(), args);
//         });
//       }
//     }
//   });
// }