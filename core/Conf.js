const path = require('path'),
  appDir = path.dirname(require.main.filename);
const logger = require('log4js').getLogger();
const _ConfigMgr = ConfigMgr = Conf = {
  config: {},
  mandatory: [
    'discord.token', 'eve.api.client_id', 'eve.api.client_secret', 'eve.api.callback', 'eve.api.scope'
  ],
  load(config) {
    var me = this;
    if (typeof config == 'string') {
      logger.debug(appDir, config, path.resolve(appDir, config));
      require(path.resolve(appDir, config));
      return this;
    }
    me.merge(me.config, config);
    return this;
  },
  get(path, defaultValue) {
    defaultValue = defaultValue || null;
    let value = this.traverse(path);
    if (defaultValue && value && defaultValue.constructor.name === "Object" && value.constructor.name === "Object")
      return { ...defaultValue,
        ...value
      }
    return value || defaultValue;
  },
  set(path, value) {
    this.traverseAndSet(path, value);
  },
  parse(args) {
    let iterator = args[Symbol.iterator]();
    for (let r; !(r = iterator.next()).done;) {
      let value = r.value;
      logger.debug('parse %s %s', value, typeof value)
      if (value.startsWith('-D')) {
        let key = value.substring(2);
        if (!(r = iterator.next()).done) {
          value = r.value;
          this.traverseAndSet(key, value);
        }
      }
    }
    return this;
  },
  validate() {
    var me = this,
      error = [];
    for (let option of me.mandatory) {
      let value = me.get(option);
      if (!value) {
        error.push(option);
      }
    }
    if (error.length) {
      throw new Error('Following options are not set : ' + error.join(', '))
    }
  },
  merge(dest, cfg) {
    var me = this;
    if (cfg instanceof Object) {
      for (var i in cfg) {
        if (cfg[i] instanceof Object && !(cfg[i] instanceof Array) && !(typeof cfg[i] == 'function')) {
          if (!dest[i])
            dest[i] = {};
          me.merge(dest[i], cfg[i]);
        } else {
          dest[i] = cfg[i];
        }
      }
    }
  },
  traverse(path) {
    var tmp = this.config;
    path = path.split('.');
    for (var i = 0, len = path.length; i < len && tmp; i++)
      tmp = tmp[path[i]];
    return tmp;
  },
  traverseAndSet(path, value) {
    var tmp = this.config;
    path = path.split('.');
    var i = 0,
      len = path.length - 1;
    for (; i < len && tmp; i++) {
      tmp = tmp[path[i]] || (tmp[path[i]] = {});

    }
    return tmp[path[len]] = value;

  }
};
module.exports = ConfigMgr