// import RESTService from "./RESTService";
// import ConfigMgr from "./ConfigMgr";
// import request, { Response } from 'request';
// import Utils from "./Utils";
// import { LOGGER } from "./Constant";
// import ServiceRegistry from "./ServiceRegistry";
// import { Service, InjectService } from "./decorators";

// const collection = 'cache';


// @Service
// export default class RemoteService {
//   @InjectService
//   restService: RESTService
//   remoteConfig: any
//   restConfig: any
//   registeredService: any = {}
//   constructor() {
//     this.remoteConfig = ConfigMgr.get('remote', {
//       host: "localhost",
//       port: 3010,
//       protocol: 'http',
//       enable: false
//     });
//     this.restConfig = ConfigMgr.get('rest', {
//       host: "localhost",
//       port: 3010,
//       protocol: 'http'
//     })
//     this.restService.builder()
//       .path('/services/:serviceName')
//       .param("path", 'serviceName')
//       .context(this)
//       .handler(this.getRegisteredService).build()
//     this.restService.builder()
//       .path('/services')
//       .context(this)
//       .handler(this.getAllRegisteredService).build()

//     this.restService.builder()
//       .path('/services/:serviceName')
//       .param("path", 'serviceName')
//       .body('serviceInfo')
//       .context(this)
//       .method('post')
//       .handler(this.registerService).build()
//     this.restService.builder()
//       .path('/services/:serviceName/:functionName')
//       .method('post')
//       .param("path", 'serviceName')
//       .param("path", 'functionName')
//       .body('data')
//       .context(this)
//       .handler(this.callService).build();
//     this.restService.builder()
//       .path('/services/:serviceName/:functionName')
//       .method('get')
//       .param("path", 'serviceName')
//       .param("path", 'functionName')
//       .param("query", 'data')
//       .context(this)
//       .handler(this.callService).build();
//   }

//   getToken() {
//     return ConfigMgr.get('remote.token', null);
//   }

//   registerService(serviceName: string, serviceInfo: any) {
//     this.registeredService[serviceName] = serviceInfo;
//   }
//   getAllRegisteredService() {
//     return this.registeredService;
//   }
//   getRegisteredService(serviceName: string) {
//     return this.registeredService[serviceName];
//   }

//   getRemoteService(serviceName: string) {
//     return new Promise((resolve, reject) => {
//       let url = this.createURL(`/services/${serviceName}`, this.remoteConfig);
//       LOGGER.debug('getRemoteService', serviceName, url);
//       request({
//         method: 'GET',
//         url: url,
//         json: true
//       }, function (error, response, body) {
//         if (error) {
//           reject(error);
//           console.error('failed:', error);
//           return
//         }
//         resolve(body);
//       })
//     })
//   }
//   registerRemoteService(serviceName: string) {
//     return new Promise((resolve, reject) => {
//       let url = this.createURL(`/services/${serviceName}`, this.remoteConfig);
//       LOGGER.debug('registerRemoteService', serviceName, url);
//       request({
//         method: 'POST',
//         url: url,
//         json: true,
//         body: this.restConfig
//       }, function (error, response, body) {
//         if (error) {
//           reject(error);
//           console.error('failed:', error);
//           return
//         }
//         resolve(body);
//       })
//     })
//   }

//   getService(serviceName: string) {
//     let serviceClass: any = ServiceRegistry.getClass(serviceName);
//     if (!serviceClass.allowRemote)
//       return null;
//     return Utils.getClassFunction(serviceClass);
//   }

//   callService(serviceName: string, functionName: string, data: any) {

//     LOGGER.debug('callService', serviceName, functionName, data);
//     let serviceClass: any = ServiceRegistry.getClass(serviceName);
//     if (!serviceClass.allowRemote)
//       return null;
//     if (typeof data === 'string')
//       data = JSON.parse(data);

//     let service: any = ServiceRegistry.get(serviceName);
//     return service[functionName].apply(service, data);
//   }
//   callRemoteService(serviceName: string, serviceInfo: any, functionName: string, data: any) {
//     return new Promise((resolve, reject) => {
//       let url = this.createURL(`/services/${serviceName}/${functionName}`, serviceInfo);
//       LOGGER.debug('callRemoteService', serviceName, functionName, data, url);
//       request({
//         method: 'POST',
//         url: url,
//         json: true,
//         body: data
//       }, function (error: Error, response: Response, body) {
//         if (error) {
//           reject(error);
//           console.error('failed:', error);
//           return
//         }
//         resolve(body);
//       })
//     })
//   }
//   createURL(path: string, serverInfo: any) {
//     let protocol = serverInfo.protocol,
//       host = serverInfo.host,
//       port = serverInfo.port,
//       token = this.getToken();
//     port = protocol == 'http' && port == 80 || protocol == 'https' && port == 443 ? "" : ":" + port;

//     return `${protocol}://${host}${port}${path}?token=${token}`
//   }
// }