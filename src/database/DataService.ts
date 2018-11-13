import path from 'path';
import ConfigMgr from '../core/ConfigMgr';
import NeDBImpl from './impl/NeDBImpl';
import MongoDBImpl from './impl/MongoDBImpl';
import { AsService } from '../core/decorators';
import { cursorTo } from 'readline';


const
  appDir = path.dirname(require.main.filename);


const defaultConfig = {
  type: "NeDB",
  path: appDir + '/data'
}



export interface IDataProvider {

  getCollections(): Promise<string[]>;
  dropCollection(collection: string): Promise<boolean>;
  insert(collection: string, data: any): Promise<any>
  find(collection: string, filter: any): Promise<any>
  findOne(collection: string, filter: any): Promise<any>
  cursor(collection: string, filter: any): Promise<DBCursor>;
  update(collection: string, filter: any, update: any, options: any): Promise<any>
  remove(collection: string, filter: any): Promise<any>
  removeOne(collection: string, filter: any): Promise<any>
  ensureIndex(collection: string, fields: any, options: any): Promise<any>
  aggregate(collection: string, pipeline: any, options: any): Promise<DBCursor>;

}


export interface DBCursor {
  sort(opt: any): DBCursor;
  project(opt: any): DBCursor;
  limit(count: number): DBCursor
  skip(count: number): DBCursor
  hasNext(): Promise<boolean>;
  next(): Promise<any>;
  toArray(): Promise<any[]>;
}


@AsService
export default class DataService {
  impl: IDataProvider
  constructor() {
    let conf = ConfigMgr.get('db', defaultConfig);
    switch (conf.type) {
      case 'NeDB':
        this.impl = new NeDBImpl(conf);
        break;
      case 'MongoDB':
        this.impl = new MongoDBImpl(conf);
        break;
      default:
        throw new Error('There is no impl for ' + conf.type + ' DB !');
    }
  }
  getProjection(obj: any) {
    let projection: any = {};
    if (typeof obj == 'function' && obj.prototype) {
      let inst = new obj();
      for (let key in inst) {
        if (typeof obj.prototype[key] == 'function')
          continue;
        projection[key] = 1;
      }
    }
    else if (typeof obj == 'object') {
      for (let key in obj) {
        projection[key] = 1;
      }
    }
    return projection;
  }

  getCollection(name: string) {
    return {};
  }
  getCollections() {
    return this.impl.getCollections();
  }
  dropCollection(collection: string) {
    return this.impl.dropCollection(collection);
  }
  insert(collection: string, data: any) {
    return this.impl.insert(collection, data);
  }
  find(collection: string, filter?: any) {
    return this.impl.find(collection, filter);
  }
  findOne(collection: string, filter?: any) {
    return this.impl.findOne(collection, filter);
  }
  cursor(collection: string, filter?: any) {
    return this.impl.cursor(collection, filter);
  }
  update(collection: string, filter: any, update: any, options?: any) {
    return this.impl.update(collection, filter, update, options);
  }
  remove(collection: string, filter?: any) {
    return this.impl.remove(collection, filter);
  }
  removeOne(collection: string, filter?: any) {
    return this.impl.removeOne(collection, filter);
  }
  ensureIndex(collection: string, fields: any, options?: any) {
    return this.impl.ensureIndex(collection, fields, options);
  }
  aggregate(collection: string, pipeline: any, options?: any): Promise<DBCursor> {
    return this.impl.aggregate(collection, pipeline, options);
  }
}
