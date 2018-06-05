const cluster = require('cluster');

/* application container*/
const defaultConfig = {
  cluster: 0
}
const logger = require('log4js').getLogger('aga-core');
class Container {
  constructor() {
    this.conf = Conf.get('container', defaultConfig);
  }
  start() {
    if (this.conf.cluster && cluster.isMaster) {
      // Fork workers.

      for (let i = 0; i < this.conf.cluster; i++) {
        cluster.fork();
      }

      cluster.on('exit', (worker, code, signal) => {
        cluster.fork();
      });
    } else {
      this.run();
    }
  }
  run() {
    /*
    NEED TO BE IMPLEMENTED
    */
  }
}
module.exports = Container;