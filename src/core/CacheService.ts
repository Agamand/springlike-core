import DataService from '../database/DataService';
import { logger } from './Constant';
import { AsService, AutoService } from './decorator';

const collection = 'cache';

@AsService
export default class CacheService {

  @AutoService
  dataService: DataService;
  cleaner: NodeJS.Timer = null;

  constructor() {
    this.cleaner = setInterval(() => {
      this.cleanCache().then((count: number) => {
        logger.debug('%s elements has been remove from cache', count);
      })
    }, 60000);
  }
  async get(key: string): Promise<any> {
    logger.debug('trying to get cache', key);
    return this.dataService.findOne(collection, {
      _id: key
    }).then((data: any) => {
      let currentDate = new Date();

      if (!data) {
        return Promise.reject(new Error('There is no data cached for the key : ' + key));
      }

      logger.debug('cache from key:', key, 'expireDate:', data.expireDate);

      if ((+currentDate - +data.expireDate) >= 0) {
        logger.debug('cache from key:', key, 'is outdated');
        return Promise.reject(new Error('Data expired'));
      }
      logger.debug('cache from key:', key, 'is ok');
      return data.data;
    });
  }
  add(key: string, expireDate: Date, data: any) {
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
  cleanCache(all?: boolean) {
    let currentDate = new Date();
    let filter = {};
    if (!all) {
      filter = {
        expireDate: {
          $lte: currentDate
        }
      }
    }
    logger.debug('clean cache', filter);
    return this.dataService.remove(collection, filter);
  }
}
//CacheService.preload = false;
