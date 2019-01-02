import path from 'path';
import fs from 'fs';
import log4js from 'log4js'
import crypto from 'crypto';
import moment from 'moment';

const appDir = path.dirname(require.main.filename);
const CONSTRUCTOR = "constructor";
const exclude = /node_modules|\.git/
const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg,
  ARGUMENT_NAMES = /([^\s,]+)/g
export default class Utils {
  private constructor() {

  }
  public static ms2unix(value: string | number): number {
    return ((+value) / 10000000 - 11644473600) * 1000
  }
  public static formatDate(timestamp: string | number): string {
    var date = isNaN(+timestamp) ? new Date(timestamp) : new Date(+timestamp);
    return moment(date).utc().format("DD/MM/YY, HH:mm [EVETIME]")
  }
  public static loadFiles(regexp: string | RegExp, baseFolder: string): Array<Object> {
    let root = baseFolder ? (path.isAbsolute(baseFolder) ? baseFolder : appDir + path.sep + baseFolder) : appDir;
    let folders = [root];
    if (!(regexp instanceof RegExp))
      regexp = new RegExp(regexp);
    let result = [];
    while (folders.length) {
      let current = folders.pop();
      var dirs = fs.readdirSync(current);

      for (let dir of dirs) {

        let absPath = path.resolve(current, dir),
          stat = fs.statSync(absPath);
        if (exclude.test(dir))
          continue; //don't want node_module ;)
        if (stat.isDirectory()) {
          folders.push(absPath);
        } else {
          let normalisedPath = absPath.replace(new RegExp('\\' + path.sep, 'g'), '/'); //only used for regexp test

          if (regexp.test(normalisedPath)) {
            result.push(require(absPath));

          }

        }
      }
    }
    return result;
  }
  public static generateRandomId(): string {
    const number = (new Date()).getTime();
    return crypto.createHash('md5').update("" + number).digest("hex");
  }
  public static getFunctionParams(func: Function): RegExpMatchArray {
    let fnStr = func.toString().replace(STRIP_COMMENTS, '');
    let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
      result = [];
    return result;
  }
  public static getClassFunction(clazz: any): Array<string> {
    let obj = [];
    for (let key of Object.getOwnPropertyNames(clazz.prototype)) {
      if (key != CONSTRUCTOR && typeof clazz.prototype[key] === 'function')
        obj.push(key);
    }
    return obj;
  }
  public static merge(dest: any, cfg: any) {
    var me = this;
    if (cfg instanceof Object) {
      for (var i in cfg) {
        if (cfg[i] instanceof Object && !(cfg[i] instanceof Array) && !(typeof cfg[i] == 'function')) {
          if (!dest[i])
            dest[i] = {};
          Utils.merge(dest[i], cfg[i]);
        } else {
          dest[i] = cfg[i];
        }
      }
    }
    return dest;
  }
  public static traverse(obj: any, path: string) {
    var tmp = obj;
    const pathPart = path.split('.');
    for (var i = 0, len = pathPart.length; i < len && tmp; i++)
      tmp = tmp[pathPart[i]];
    return tmp;
  }
  public static traverseAndSet(obj: any, path: string, value: any) {
    var tmp = obj;
    const pathPart = path.split('.');
    var i = 0,
      len = pathPart.length - 1;
    for (; i < len && tmp; i++) {
      tmp = tmp[pathPart[i]] || (tmp[pathPart[i]] = {});

    }
    return tmp[pathPart[len]] = value;

  }
}