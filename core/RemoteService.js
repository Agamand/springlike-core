const collection = 'cache',
  express = require('express'),
  logger = require('log4js').getLogger(),
  crypto = require('crypto'),
  Utils = require('./Utils'),
  request = require('request');

class RemoteService {
  constructor() {
    this.RestService = Service.get('RESTService');
    this.remoteConfig = Conf.get('remote', {
      host: "localhost",
      port: 3010,
      protocol: 'http',
      enable: false
    });
    this.restConfig = Conf.get('rest', {
      host: "localhost",
      port: 3010,
      protocol: 'http'
    })
    this.RestService.builder()
      .path('/services/:serviceName')
      .param("path", 'serviceName')
      .context(this)
      .handler(this.getRegisteredService).build()
    this.RestService.builder()
      .path('/services')
      .context(this)
      .handler(this.getAllRegisteredService).build()

    this.RestService.builder()
      .path('/services/:serviceName')
      .param("path", 'serviceName')
      .param('body', 'serviceInfo')
      .param('context', 'ctx')
      .context(this)
      .method('post')
      .handler(this.registerService).build()
    this.RestService.builder()
      .path('/services/:serviceName/:functionName')
      .method('post')
      .param("path", 'serviceName')
      .param("path", 'functionName')
      .param("body", 'data')
      .context(this)
      .handler(this.callService).build();
    this.RestService.builder()
      .path('/services/:serviceName/:functionName')
      .method('get')
      .param("path", 'serviceName')
      .param("path", 'functionName')
      .param("query", 'data')
      .context(this)
      .handler(this.callService).build();


    this.registeredService = {};

  }

  getToken() {
    return Conf.get('remote.token', null);
  }

  registerService(serviceName, serviceInfo) {
    this.registeredService[serviceName] = serviceInfo;
  }
  getAllRegisteredService() {
    return this.registeredService;
  }
  getRegisteredService(serviceName) {
    return this.registeredService[serviceName];
  }

  getRemoteService(serviceName) {
    return new Promise((resolve, reject) => {
      let url = this.createURL(`/services/${serviceName}`, this.remoteConfig);
      logger.debug('getRemoteService', serviceName, url);
      request({
        method: 'GET',
        url: url,
        json: true
      }, function(error, response, body) {
        if (error) {
          reject(error);
          console.error('failed:', error);
          return
        }
        resolve(body);
      })
    })
  }
  registerRemoteService(serviceName) {
    return new Promise((resolve, reject) => {
      let url = this.createURL(`/services/${serviceName}`, this.remoteConfig);
      logger.debug('registerRemoteService', serviceName, url);
      request({
        method: 'POST',
        url: url,
        json: true,
        body: this.restConfig
      }, function(error, response, body) {
        if (error) {
          reject(error);
          console.error('failed:', error);
          return
        }
        resolve(body);
      })
    })
  }

  getService(serviceName) {
    let serviceClass = Service.getClass(serviceName);
    if (!serviceClass.allowRemote)
      return null;
    return Utils.getClassFunction(serviceClass);
  }

  callService(serviceName, functionName, data) {

    logger.debug('callService', serviceName, functionName, data);
    let serviceClass = Service.getClass(serviceName);
    if (!serviceClass.allowRemote)
      return null;
    if (typeof data === 'string')
      data = JSON.parse(data);

    let service = Service.get(serviceName);
    return service[functionName].apply(service, data);
  }
  callRemoteService(serviceName, serviceInfo, functionName, data) {
    return new Promise((resolve, reject) => {
      let url = this.createURL(`/services/${serviceName}/${functionName}`, serviceInfo);
      logger.debug('callRemoteService', serviceName, functionName, data, url);
      request({
        method: 'POST',
        url: url,
        json: true,
        body: data
      }, function(error, response, body) {
        if (error) {
          reject(error);
          console.error('failed:', error);
          return
        }
        resolve(body);
      })
    })
  }
  createURL(path, serverInfo) {
    let protocol = serverInfo.protocol,
      host = serverInfo.host,
      port = serverInfo.port,
      token = this.getToken();
    port = protocol == 'http' && port == 80 || protocol == 'https' && port == 443 ? "" : ":" + port;

    return `${protocol}://${host}${port}${path}?token=${token}`
  }



}

RemoteService.preload = true;
module.exports = RemoteService;