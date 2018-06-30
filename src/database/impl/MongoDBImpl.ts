import { MongoClient, Db, Collection, MongoError } from 'mongodb';
import { logger } from '../../core/Constant';

export default class MongoDBImpl {
  databaseName: string;
  dbURI: string;
  database: Db;
  databasePromise: Promise<Db>
  constructor(conf: any) {
    this.databaseName = conf.database;
    this.dbURI = conf.dburi;
  }
  getDatabase(): Promise<Db> {
    if (this.database)
      return Promise.resolve(this.database);
    if (this.databasePromise) {
      return this.databasePromise
    }
    return this.databasePromise = new Promise((resolve, reject) => {
      MongoClient.connect(this.dbURI, (err, client) => {
        if (err) {
          delete this.databasePromise;
          return reject(err);
        }
        this.database = client.db(this.databaseName);
        delete this.databasePromise;
        resolve(this.database);
      });
    });
  }
  getCollection(name: string): Promise<Collection> {
    return this.getDatabase().then((database) => {
      return database.collection(name);
    })
  }
  insert(collection: string, data: any) {
    return this.getCollection(collection).then((collection) => {
      return collection.insert(data, (err, newDocs) => {
        if (err) {
          logger.error('Error while inserting into', collection, err);
          throw new Error(err.message);
        }
        return (newDocs)
      })
    });

  }
  find(collection: string, filter: any) {
    return this.getCollection(collection).then((collection) => {
      let cursor = collection.find(filter);
      return cursor.toArray();
    })
  }
  findOne(collection: string, filter: any) {
    return this.getCollection(collection).then((collection) => {
      return collection.findOne(filter, (err, docs) => {
        if (err) {
          logger.error('Error while finding in', collection, err);
          throw new Error(err.message);
        }
        return docs;
      })
    })
  }
  update(collection: string, filter: any, update: any, options: any) {
    options = options || {}

    return this.getCollection(collection).then((collection) => {
      return collection.update(filter, update, options, (err, docs) => {
        if (err) {
          logger.error('Error while updating', collection, err);
          throw new Error(err.message);
        }
        return docs;
      })
    })
  }
  remove(collection: string, filter: any) {
    let options: any = {
      multi: true
    }
    return this.getCollection(collection).then((collection) => {
      return collection.remove(filter, options, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          throw new Error(err.message);
        }
        return docs;
      })
    })
  }
  removeOne(collection: string, filter: any) {
    let options = {}
    return this.getCollection(collection).then((collection) => {
      return collection.remove(filter, options, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          throw new Error(err.message);
        }
        return docs;;
      })
    })
  }
  ensureIndex(collection: string, fields: any, options: any) {
    options = options || {};
    return this.getCollection(collection).then((collection) => {

      return collection.createIndex(fields, options, (err, docs) => {
        if (err) {
          logger.error('Error while removing', collection, err);
          throw new Error(err.message);
        }
        return docs;
      })
    })
  }
}
