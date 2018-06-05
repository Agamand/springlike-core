const path = require('path'),
  fs = require('fs'),
  appDir = path.dirname(require.main.filename),
  Utils = require('./Utils');


const logger = require('log4js').getLogger();

const service = Service = {
  services: {},
  instance: {},
  load(regexp, basefolder) {
    Utils.loadFiles(regexp, basefolder).forEach((service) => {
      this.register(service);
    })
  },
  register(clazz) {
    logger.info('load service :', clazz.name);
    this.services[clazz.name] = clazz
  },
  getClass(className) {
    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }
    return this.services[className];
  },
  get(className) {
    const serviceConf = Conf.get('services', {});
    const remoteConf = Conf.get('remote', {
      enable: false
    });
    if (this.instance[className])
      return this.instance[className];


    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }


    let instance = null;
    if (this.services[className].allowRemote && remoteConf.enable && !serviceConf[className]) {
      logger.debug('Instanciate remote', className);
      instance = new Remote(className);
    } else {
      logger.debug('Instanciate', className);
      instance = new this.services[className]();

    }
    return (this.instance[className] = instance)
  },
  preLoad(...serviceName) {
    let service2Preload = {}
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
class ServiceProvider {

}


class Remote {
  constructor(serviceName) {
    const remoteService = Service.get("RemoteService")
    let serviceClass = Service.getClass(serviceName);
    let functions = Utils.getClassFunction(serviceClass);
    for (let name of functions) {
      var me = this;
      me[name] = function(...args) {
        return remoteService.getRemoteService(serviceName).then((serviceInfo) => {
          return remoteService.callRemoteService(serviceName, serviceInfo, name, args);
        });
      }

    }
  }

}

module.exports = service;