import path from 'path';
import ConfigMgr from '../core/ConfigMgr';
import NeDBImpl from './impl/NeDBImpl';
import MongoDBImpl from './impl/MongoDBImpl';
import { AsService } from '../core/decorator';


const
  appDir = path.dirname(require.main.filename);


const defaultConfig = {
  type: "NeDB",
  path: appDir + '/data'
}



export interface IDataProvider {

  insert(collection: string, data: any): Promise<any>
  find(collection: string, filter: any): Promise<any>
  findOne(collection: string, filter: any): Promise<any>
  update(collection: string, filter: any, update: any, options: any): Promise<any>
  remove(collection: string, filter: any): Promise<any>
  removeOne(collection: string, filter: any): Promise<any>
  ensureIndex(collection: string, fields: any, options: any): Promise<any>

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
  getCollection(name: string) {
    return {};
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
}
