const collection = 'cache',
  express = require('express'),
  logger = require('log4js').getLogger(),
  crypto = require('crypto'),
  Utils = require('./Utils'),
  request = require('request');
const remote = Conf.get('remote', {});
class RemoteService {
  constructor() {
    this.RestService = Service.get('RESTService');

    this.RestService.builder().path('/services/:serviceName').param("path", 'serviceName').context(this).handler(this.getService).build()
    this.RestService.builder().path('/services/:serviceName/:functionName').method('post').param("path", 'serviceName').param("path", 'functionName').param("body", 'data').context(this).handler(this.callService).build();
    this.RestService.builder().path('/services/:serviceName/:functionName').method('get').param("path", 'serviceName').param("path", 'functionName').param("query", 'data').context(this).handler(this.callService).build();

  }
  getHost() {
    return Conf.get('remote.host', 'localhost');
  }
  getPort() {
    return Conf.get('remote.port', '3010');
  }
  getProtocol() {
    return Conf.get('remote.protocol', 'http');
  }
  getToken() {
    return Conf.get('remote.token', null);
  }



  registerServer(serverInfo) {

  }
  remoteRegister(serviceName, serverID) {

  }

  getRemoteService(serviceName) {

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
  callRemoteService(serviceName, functionName, data) {
    return new Promise((resolve, reject) => {
      let url = this.createURL(`/services/${serviceName}/${functionName}`);
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
  createURL(path) {
    let protocol = this.getProtocol(),
      host = this.getHost(),
      port = this.getPort(),
      token = this.getToken();
    port = protocol == 'http' && port == 80 || protocol == 'https' && port == 443 ? "" : ":" + port;

    return `${protocol}://${host}${port}${path}?token=${token}`
  }



}

RemoteService.preload = true;
module.exports = RemoteService;