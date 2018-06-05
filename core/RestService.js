const collection = 'cache',
  express = require('express'),
  bodyParser = require('body-parser'),
  logger = require('log4js').getLogger(),
  crypto = require('crypto'),
  Utils = require('./Utils');
class RESTService {
  constructor() {
    this.app = express();
    this.app.use(bodyParser.json())
    this.server = this.app.listen(this.getPort(), function() {})
    this.tokens = {};
    let serverToken = Conf.get('rest.token');
    if (serverToken)
      this.tokens[serverToken] = true;
  }
  getHost() {
    return Conf.get('rest.host', 'localhost');
  }
  getPort() {
    return Conf.get('rest.port', '3010');
  }
  getPublicPort() {
    return Conf.get('rest.publicPort', this.getPort());
  }
  getProtocol() {
    return Conf.get('rest.protocol', 'http');
  }
  loadRESTPoint(regexp, baseDir) {
    Utils.loadFiles(regexp, baseDir).forEach((entry) => {
      if (typeof entry == 'function')
        entry();
      else if (typeof entry == 'object') {
        for (let k in entry)
          entry[k]();
      }
    })
  }
  get(path, handler) {
    logger.debug('REST register method: GET, path:', path);
    this.app.get(path, (...args) => {
      logger.debug('REST call method: GET path:', path);
      return handler.apply(null, args);
    });
  }
  post(path, handler) {
    logger.debug('REST register method: POST, path:', path);
    this.app.post(path, (...args) => {
      logger.debug('REST call method: POST, path:', path);
      return handler.apply(null, args);
    });
  }
  put(path, handler) {
    logger.debug('REST register method: PUT, path:', path);
    this.app.put(path, (...args) => {
      logger.debug('REST call method: PUT, path:', path);
      return handler.apply(null, args);
    });
  }
  delete(path, handler) {
    logger.debug('REST register method: DELETE, path:', path);
    this.app.delete(path, (...args) => {
      logger.debug('REST call method: DELETE, path:', path);
      return handler.apply(null, args);
    });
  }
  createTemporyToken(time) {
    time = time || 60;
    let token = Utils.generateRandomId();
    setTimeout(() => {
      delete this.tokens[token];
    }, time * 1000);
    this.tokens[token] = true;
    return token;
  }
  isAllowedToken(token) {
    return this.tokens[token] && true || false;
  }
  builder() {
    return new RestBuilder();
  }
  createURL(path) {
    let protocol = this.getProtocol(),
      host = this.getHost(),
      port = this.getPublicPort();
    port = protocol == 'http' && port == 80 || protocol == 'https' && port == 443 ? "" : ":" + port;

    return `${protocol}://${host}${port}${path}`
  }
}




const QUERY_OR_PATH = {
  path: 1,
  query: 1
};
const validateQuery = function(requestParam, params) {
  for (let key in params) {
    let type = params[key];
    //if a query or path param and there no value
    if (!(key in requestParam[type]) && (type in QUERY_OR_PATH)) {

      logger.debug(key, type, 'not found in param', requestParam);
      return false;
    }
    if (type == 'body' && !requestParam.body) {
      logger.debug('body is required');
    }
  }
  return true;
}
const getParamValue = function(type, name, requestParam) {
  if (type == 'body' || type == 'context')
    return requestParam[type] || null;

  return requestParam[type] && requestParam[type][name] || null;
}

const getParams = function(requestParam, params, functionParams) {
  let result = [];
  for (let param of functionParams) {
    result.push(getParamValue(params[param], param, requestParam));
  }
  return result;
}
const wrapHandler = function(handler, params, context, secure) {
  const rest = Service.get('RESTService')
  return function(req, res) {
    let query = req && req.query || {};
    if (secure && !rest.isAllowedToken(query.token)) {
      res.status(403).end();
      return;
    }
    let requestParam = {
      context: req,
      path: req.params || {},
      query: req.query || {},
      body: req.body || {}
    }
    if (!validateQuery(requestParam, params)) {

      logger.debug('query not valid');
      res.status(400).end();
      return;
    }
    let functionParams = Utils.getFunctionParams(handler);
    let result = handler.apply(context, getParams(requestParam, params, functionParams));
    if (!(result instanceof Promise)) {
      result = Promise.resolve(result);
    }
    result.then((data) => {
      if (null === data) {
        logger.debug('no data');
        res.status(404).end();
        return;
      }
      if (query.format && Renderer[query.format]) {
        data = Renderer[query.format](data);
        res.type(Renderer[query.format].contentType);
      }
      res.send(data);
    }).catch((e) => {
      res.status(500).end();
    });
  }
}

const Renderer = {}
Renderer.text = function(data) {
  if (!(data instanceof Array)) {
    data = [data];
  }
  let buffer = [];
  let keys = Object.keys(data[0]);
  buffer.push(keys.join('\t'));
  for (let entry of data) {
    let line = [];
    for (let k of keys) {
      line.push(entry[k]);
    }
    buffer.push(line.join('\t'));
  }
  buffer.push(' ');
  return buffer.join('\n')
}
Renderer.text.contentType = "text"



class RestBuilder {
  constructor() {
    this._path = "/";
    this._method = 'get';
    this._secure = true;
    this._handler = function() {};
    this._params = {};
    this._context = null;
  }
  path(path) {
    this._path = path;
    return this;
  }
  method(method) {
    this._method = method;
    return this;
  }
  secure(secure) {
    this._secure = secure;
    return this;
  }
  handler(handler) {
    this._handler = handler;
    return this;
  }
  param(type, name) {
    this._params[name] = type;
    return this;
  }
  context(context) {
    this._context = context;
    return this;
  }
  build() {
    const rest = Service.get('RESTService')
    let handler = wrapHandler(this._handler, this._params, this._context, this._secure);
    rest[this._method](this._path, handler)
  }
}




RESTService.preload = true;





module.exports = RESTService;