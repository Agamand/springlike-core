const collection = 'cache';
const logger = require('log4js').getLogger();
class CacheService {
  constructor() {
    this.structInfoCache = {};
    this.dataService = Service.get('DataService');
    this.cleaner = setInterval(() => {
      this.cleanCache().then((count) => {
        logger.debug(count, 'elements has been remove from cache');
      })
    }, 60000);
  }
  get(key) {
    logger.debug('trying to get cache', key);
    return this.dataService.findOne(collection, {
      _id: key
    }).then((data) => {
      let currentDate = new Date();
      logger.debug('cache from key:', key, 'expireDate:', data.expireDate, currentDate - data.expireDate);

      if (!data || (currentDate - data.expireDate) >= 0) {
        logger.debug('cache from key:', key, 'is outdated');
        return Promise.reject('Data expired');
      }
      logger.debug('cache from key:', key, 'is ok');
      return data.data;
    });
  }
  add(key, expireDate, data) {
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
  cleanCache(all) {
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
CacheService.preload = false;





module.exports = CacheService;