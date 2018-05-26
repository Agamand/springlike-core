const path = require('path'),
  appDir = path.dirname(require.main.filename);
const defaultConfig = {
  type: "NeDB",
  path: appDir + '/data'
}
const MongoDBImpl = require('./impl/MongoDBImpl'),
  NeDBImpl = require('./impl/NeDBImpl');

class DataService {
  constructor() {
    let conf = Conf.get('db', defaultConfig);
    switch (conf.type) {
      case 'NeDB':
        this.impl = new NeDBImpl(conf);
        break;
      case 'MongoDB':
        this.impl = new MongoDBImpl(conf);
        break;
      default:
        throw new Error('There is no impl for ' + type + ' DB !');
    }
  }
  getCollection(name) {
    return {};
  }
  insert(collection, data) {
    return this.impl.insert(collection, data);
  }
  find(collection, filter) {
    return this.impl.find(collection, filter);
  }
  findOne(collection, filter) {
    return this.impl.findOne(collection, filter);
  }
  update(collection, filter, update, options) {
    return this.impl.update(collection, filter, update, options);
  }
  remove(collection, filter) {
    return this.impl.remove(collection, filter);
  }
  removeOne(collection, filter) {
    return this.impl.removeOne(collection, filter);
  }
  ensureIndex(collection, fields, options) {
    return this.impl.ensureIndex(collection, fields, options);
  }
}

module.exports = DataService;