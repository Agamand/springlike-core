const path = require('path'),
  fs = require('fs'),
  appDir = path.dirname(require.main.filename),
  Utils = require('./Utils');


const logger = require('log4js').getLogger();
const remoteService = Conf.get('remote.services', {});
const service = Service = {
  services: {},
  instance: {},
  load(regexp) {
    Utils.loadFiles(regexp).forEach((service) => {
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
    if (this.instance[className])
      return this.instance[className];


    if (!this.services[className]) {
      throw new Error('unknow service ' + className)
    }


    let instance = null;
    console.log(remoteService);
    if (remoteService[className]) {
      logger.debug('Instanciate remote', className);
      instance = new Remote(className);
    } else {
      logger.debug('Instanciate', className);
      instance = new this.services[className]();
    }
    return (this.instance[className] = instance)
  },
  preLoad() {
    logger.debug('Preload services');
    for (let serviceKey in this.services) {
      let service = this.services[serviceKey];
      if (service.preload)
        this.get(serviceKey);
    }
  }

}


class Remote {
  constructor(serviceName) {
    const remoteService = Service.get("RemoteService")
    let serviceClass = Service.getClass(serviceName);
    let functions = Utils.getClassFunction(serviceClass);
    for (let name of functions) {
      var me = this;
      me[name] = function(...args) {
        return remoteService.callRemoteService(serviceName, name, args);
      }

    }
  }

}

module.exports = service;