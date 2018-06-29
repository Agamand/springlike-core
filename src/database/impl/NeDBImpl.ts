import log4js from 'log4js';
import Datastore from 'nedb';
import { IDataProvider } from '../DataService';


const logger = require('log4js').getLogger();
export default class NeDBImpl implements IDataProvider {
  dataPath: string
  collections: { [key: string]: Datastore }
  constructor(conf: any) {
    this.dataPath = conf.path
    this.collections = {};
  }
  getCollection(name: string) {
    if (this.collections[name])
      return this.collections[name];
    logger.debug('load NeDB collection', name, this.dataPath + '/' + name)
    this.collections[name] = new Datastore({
      filename: this.dataPath + '/' + name,
      autoload: true
    })
    this.collections[name].persistence.setAutocompactionInterval(5000);
    return this.collections[name];
  }
  insert(collection: string, data: any) {
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
  find(collection: string, filter: any) {
    return new Promise((resolve, reject) => {
      this.getCollection(collection).find(filter, (err: Error, docs: any) => {
        if (err) {

          logger.error('Error while finding in', collection, err);
          return reject(err);
        }
        resolve(docs)
      })
    })
  }
  findOne(collection: string, filter: any) {
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
  update(collection: string, filter: any, update: any, options: any) {
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
  remove(collection: string, filter: any) {
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
  removeOne(collection: string, filter: any) {
    let options = {}
    return new Promise((resolve, reject) => {
      this.getCollection(collection).remove(filter, options, (err: Error, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          return reject(err);
        }
        resolve(docs);
      })
    })
  }
  ensureIndex(collection: string, fields: any, options: any) {
    options = options || {};
    let fieldNames = Object.keys(fields);
    return new Promise((resolve, reject) => {
      this.getCollection(collection).ensureIndex({
        ...options,
        fieldName: fieldNames
      }, (err: Error) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          return reject(err);
        }
        resolve()
      })
    })
  }
}