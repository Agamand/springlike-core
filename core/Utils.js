const path = require('path'),
  fs = require('fs'),
  appDir = path.dirname(require.main.filename),
  crypto = require('crypto'),
  moment = require('moment');
const CONSTRUCTOR = "constructor";
const excludeFolder = /node_modules|\.git/
const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg,
  ARGUMENT_NAMES = /([^\s,]+)/g
module.exports = {
  ms2unix: function(value) {
    return ((+value) / 10000000 - 11644473600) * 1000
  },
  formatDate: function(timestamp) {
    var date = new Date(timestamp);
    return moment(date).utc().format("DD/MM/YY, HH:mm [EVETIME]")
  },
  loadFiles(regexp, baseFolder) {
    let root = baseFolder ? appDir + path.sep + baseFolder : appDir;
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

        if (excludeFolder.test(absPath))
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
  },
  generateRandomId() {
    var number = (new Date()).getTime();

    return crypto.createHash('md5').update("" + number).digest("hex");
  },
  getFunctionParams(func) {
    var fnStr = func.toString().replace(STRIP_COMMENTS, '');
    var result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
    if (result === null)
      result = [];
    return result;
  },
  getClassFunction(clazz) {
    let obj = [];
    for (let key of Object.getOwnPropertyNames(clazz.prototype)) {
      if (key != CONSTRUCTOR && typeof clazz.prototype[key] === 'function')
        obj.push(key);
    }
    return obj;
  }
}