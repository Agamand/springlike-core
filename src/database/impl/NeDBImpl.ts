import Datastore from 'nedb';
import { IDataProvider, DBCursor } from '../DataService';
import fs from 'fs';
import { rejects } from 'assert';


const logger = require('log4js').getLogger();
export default class NeDBImpl implements IDataProvider {
  dataPath: string
  collections: { [key: string]: Datastore }
  constructor(conf: any) {
    this.dataPath = conf.path
    this.collections = {};
  }
  private getCollectionPath(name: string): string {
    return this.dataPath + '/' + name;
  }
  private getCollection(name: string) {
    if (this.collections[name])
      return this.collections[name];
    logger.debug('load NeDB collection', name, this.dataPath + '/' + name)
    this.collections[name] = new Datastore({
      filename: this.getCollectionPath(name),
      autoload: true
    })
    this.collections[name].persistence.setAutocompactionInterval(5000);
    return this.collections[name];
  }
  getCollections(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      fs.exists(this.dataPath, (exists) => {
        if (!exists)
          return resolve([]);
        fs.readdir(this.dataPath, (err, files) => {
          if (err)
            return reject(err);
          return resolve(files.filter((f) => {
            let path = this.getCollectionPath(f);
            return fs.statSync(path).isFile;
          }));
        })
      })
    });
  }
  dropCollection(name: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      delete this.collections[name];
      let collectionPath = this.getCollectionPath(name);
      fs.exists(collectionPath, (exists) => {
        if (exists) {
          fs.unlink(collectionPath, (err) => {
            if (err) return reject(err);
            return resolve(true);
          });
        } else resolve(true);
      });

    })
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
  async cursor(collection: string, filter: any): Promise<DBCursor> {
    let cursor = this.getCollection(collection).find(filter);
    return new NeDBCursor(cursor);
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
  aggregate(collection: string, pipeline: any, options?: any): Promise<DBCursor> {
    return Promise.reject('There is no implementation for aggregate in NEDB')
  }
}
class NeDBCursor implements DBCursor {

  cursor: Datastore.Cursor<{}>;
  data: any[] = null;
  current: number = 0;
  resolver: Promise<any[]> = null;
  constructor(cursor: Datastore.Cursor<{}>) {
    this.cursor = cursor;
  }
  private async resolve(): Promise<any[]> {
    if (this.data)
      return this.data;
    if (this.resolver)
      return this.resolver;
    return this.resolver = new Promise<any[]>((resolve, reject) => {
      this.cursor.exec((err, docs) => {
        if (err)
          return reject(err);
        this.data = docs;
        this.resolver = null;
        resolve(docs);
      });
    })
  }
  sort(opt: any): DBCursor {
    this.cursor.sort(opt);
    return this;
  }
  project(opt: any): DBCursor {
    this.cursor.projection(opt);
    return this;
  }
  limit(count: number): DBCursor {
    this.cursor.limit(count);
    return this;
  }
  skip(count: number): DBCursor {
    this.cursor.skip(count);
    return this;
  }
  async hasNext(): Promise<boolean> {
    await this.resolve();
    return this.current < this.data.length;
  }
  async next(): Promise<any> {
    await this.resolve();
    return this.data[this.current++];
  }
  async toArray(): Promise<any[]> {
    await this.resolve();
    return this.data;
  }
}