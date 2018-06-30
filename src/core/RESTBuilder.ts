import { RESTService, Service, Utils } from '..';
import { Request, Response } from 'express';
import { logger } from './Constant';

const QUERY_OR_PATH = {
    path: 1,
    query: 1
};
const validateQuery = function (requestParam: any, params: any) {
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
const getParamValue = function (type: string, name: string, requestParam: any) {
    if (type == 'body' || type == 'context')
        return requestParam[type] || null;

    return requestParam[type] && requestParam[type][name] || null;
}

const getParams = function (requestParam: any, params: any, functionParams: any) {
    let result = [];
    for (let param of functionParams) {
        result.push(getParamValue(params[param], param, requestParam));
    }
    return result;
}
const wrapHandler = function (handler: Function, params: any, context: any, secure: boolean) {
    const rest: RESTService = Service.get('RESTService')
    return function (req: Request, res: Response) {
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
        result.then((data: any) => {
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
        }).catch((e: Error) => {
            res.status(500).end();
        });
    }
}

const Renderer: any = {}
Renderer.text = function (data: any) {
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



export class RestBuilder {
    _path: string = "/";
    _method: string = 'get';
    _secure: boolean = true;
    _handler: Function = function () { };
    _params: any = {};
    _context: any = null;
    constructor() {
    }
    path(path: string): RestBuilder {
        this._path = path;
        return this;
    }
    method(method: string): RestBuilder {
        this._method = method;
        return this;
    }
    secure(secure: boolean): RestBuilder {
        this._secure = secure;
        return this;
    }
    handler(handler: Function): RestBuilder {
        this._handler = handler;
        return this;
    }
    param(type: string, name: string): RestBuilder {
        this._params[name] = type;
        return this;
    }
    context(context: any): RestBuilder {
        this._context = context;
        return this;
    }
    build(): void {
        const rest: any = Service.get('RESTService')
        let handler = wrapHandler(this._handler, this._params, this._context, this._secure);
        rest[this._method](this._path, handler)
    }
}
