import request from 'request';
import Path from 'path';
import { Stream } from 'stream';
import { LOGGER } from './Constant';

const requestApi = request.defaults({ jar: true })

export class RequestBuilder {
  _host: string = 'localhost';
  _protocol: string = 'http'
  _path: string = "/";
  _method: string = 'GET';
  _secure: boolean = true;
  _header: any = {};
  _handler: Function = function () { };
  _params: any = {};
  _context: any = null;
  _successCode: number = 200;
  constructor() {
  }
  protocol(protocol: string): RequestBuilder {
    this._protocol = protocol.replace(/:/, '');

    return this;
  }
  host(host: string): RequestBuilder {
    this._host = host;
    return this;
  }
  header(key: string, value: string): RequestBuilder {
    this._header[key] = value;
    return this;
  }
  path(path: string): RequestBuilder {
    this._path = Path.normalize(path).replace(/\\\\|\\/g, '/');
    return this;
  }
  method(method: string): RequestBuilder {
    this._method = method.toUpperCase();
    return this;
  }
  secure(secure: boolean): RequestBuilder {
    this._secure = secure;
    return this;
  }
  successCode(successCode: number) {
    this._successCode = successCode;
    return this;
  }
  handler(handler: Function): RequestBuilder {
    this._handler = handler;
    return this;
  }
  param(type: string, name: string, value: any): RequestBuilder {
    this._params[type] = this._params[type] || {};
    this._params[type][name] = value;
    return this;
  }
  body(value: any) {
    this._params["body"] = value;
    return this;
  }
  context(context: any): RequestBuilder {
    this._context = context;
    return this;
  }
  computePath(): string {
    let path = this._path;
    if (this._params.path) {
      for (let key in this._params.path) {
        path = path.replace(`:${key}`, this._params.path[key]);
      }
    }
    let queryPath = '';
    if (this._params.query) {
      let query = [];
      for (let key in this._params.query) {
        query.push(`${key}=${this._params.query[key]}`)
      }
      queryPath = '?' + query.join('&');
    }
    return path + queryPath;
  }

  build(): Function {
    const me = this;
    return async function (): Promise<request.Response> {
      return new Promise<request.Response>((resolve: Function, reject: Function) => {
        const url = `${me._protocol}://${me._host}${me.computePath()}`;
        LOGGER.debug('call request on ', url, me._host, me._path);

        // request({
        //   method: me._method,
        //   url: url,
        //   headers: me._header,
        //   body: me._params["body"] || null,
        //   json: true
        // }, function (error: any, response: request.Response, body: any) {
        //   if (error) {
        //     return reject(error);
        //   }
        //   if (me._successCode != response.statusCode) {
        //     return reject(new Error('got a ' + response.statusCode + ' status code'));
        //   }
        //   resolve(response);
        // })
        let req = requestApi({
          method: me._method,
          url: url,
          headers: me._header,
        }).on('error', (error) => {
          if (error) {
            return reject(error);
          }
        }).on('response', (response) => {
          if (me._successCode != response.statusCode) {
            return reject(new Error('got a ' + response.statusCode + ' status code'));
          }
          let buffer: any[] = [];
          response.on('data', (chunk) => buffer.push(chunk))
          response.on('end', () => {
            let data = Buffer.concat(buffer).toString();
            try {
              response.body = JSON.parse(data);
            } catch (e) {
              response.body = data;
            }
            resolve(response);
          })
        })
        if (!me._params["body"]) {
          req.write("");
        }
        else if (me._params["body"] instanceof Stream) {
          me._params["body"].pipe(req);
        }
        else if (typeof me._params["body"] == 'object') {
          req.write(JSON.stringify(me._params["body"]));
        }
        else {
          req.write(me._params["body"]);
        }
      });
    }
  }
}