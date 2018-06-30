import log4js from 'log4js';
export const PATH_PARAM_META_KEY = Symbol("rest:pathParam");
export const QUERY_PARAM_META_KEY = Symbol("rest:queryParam");
export const HEADER_PARAM_META_KEY = Symbol("rest:headerParam");
export const BODY_META_KEY = Symbol("rest:body");
export const METHOD_META_KEY = Symbol("rest:method");
export const PATH_META_KEY = Symbol("rest:path");
export const logger = log4js.getLogger();