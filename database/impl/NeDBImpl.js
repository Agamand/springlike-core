const Datastore = require('nedb')


const logger = require('log4js').getLogger();
class NeDBImpl {
  constructor(conf) {
    this.dataPath = conf.path
    this.collections = {};
  }
  getCollection(name) {
    if (this.collections[name])
      return this.collections[name];
    logger.debug('load NeDB collection', name, this.dataPath + '/' + name)
    this.collections[name] = this.db = new Datastore({
      filename: this.dataPath + '/' + name,
      autoload: true
    })
    this.collections[name].persistence.setAutocompactionInterval(5000);
    return this.collections[name];
  }
  insert(collection, data) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).insert(data, (err, newDocs) => {
        if (err) {
          logger.error('Error while inserting into', collection, err);
          return reject(err);
        }
        resolve(newDocs)
      })
    })
  }
  find(collection, filter) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).find(filter, (err, docs) => {
        if (err) {

          logger.error('Error while finding in', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
  findOne(collection, filter) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).findOne(filter, (err, docs) => {
        if (err) {
          logger.error('Error while finding in', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
  update(collection, filter, update, options) {
    options = options || {}
    return new Promise((resolve, reject) => {
      this.getCollection(collection).update(filter, update, options, (err, docs) => {
        if (err) {
          logger.error('Error while updating', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
  remove(collection, filter) {
    let options = {
      multi: true
    }
    return new Promise((resolve, reject) => {
      this.getCollection(collection).remove(filter, options, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
  removeOne(collection, filter) {
    let options = {}
    return new Promise((resolve, reject) => {
      this.getCollection(collection).remove(filter, options, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          return reject(err);
        }
        resolve(docs);
      })
    })
  }
  ensureIndex(collection, fields, options) {
    options = options || {};
    let fieldNames = Object.keys(fields);
    return new Promise((resolve, reject) => {
      this.getCollection(collection).ensureIndex({ ...options,
        fieldName: fieldNames
      }, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
}

module.exports = NeDBImpl;