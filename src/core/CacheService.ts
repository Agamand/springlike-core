//import DataService from '../database/DataService';
import { LOGGER } from './Constant';
import { Service, InjectService, OptionalService } from './decorators';

const collection = 'cache';

@Service
export default class CacheService {

  
  @InjectService("DataService")
  @OptionalService
  dataService: any;
  cleaner: NodeJS.Timer = null;

  constructor() {
    this.cleaner = setInterval(() => {
      this.cleanCache().then((count: number) => {
        LOGGER.debug('%s elements has been remove from cache', count);
      })
    }, 60000);
  }
  async get(key: string): Promise<any> {
    LOGGER.debug('trying to get cache', key);

    if (!this.dataService)
      throw new Error('There is no data manager')

    let data = await this.dataService.findOne(collection, {
      _id: key
    })
    let currentDate = new Date();

    if (!data) {
      throw new Error('There is no data cached for the key : ' + key);
    }

    LOGGER.debug('cache from key:', key, 'expireDate:', data.expireDate);

    if ((+currentDate - +data.expireDate) >= 0) {
      LOGGER.debug('cache from key:', key, 'is outdated');
      throw new Error('Data expired');
    }
    LOGGER.debug('cache from key:', key, 'is ok');
    return data.data;
  }
  add(key: string, expireDate: Date, data: any) {
    if (!this.dataService) {
      return Promise.resolve(null);
    }
    return this.dataService.update(collection, {
      _id: key
    }, {
        _id: key,
        expireDate: expireDate,
        data: data
      }, {
        upsert: true
      }).then(() => {
        return data;
      }).catch(() => {
        return data;
      })
  }
  async cleanCache(all?: boolean): Promise<number> {
    let currentDate = new Date();
    let filter = {};
    if (!all) {
      filter = {
        expireDate: {
          $lte: currentDate
        }
      }
    }
    LOGGER.debug('clean cache', filter);
    if (this.dataService)
      return this.dataService.remove(collection, filter);
    return Promise.resolve(0);
  }
}
//CacheService.preload = false;
