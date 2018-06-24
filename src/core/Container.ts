import cluster from 'cluster';
import log4js from 'log4js';
import ConfigMgr from './ConfigMgr';
/* application container*/
const defaultConfig = {
  cluster: 0
}
const logger = log4js.getLogger('aga-core');
export default abstract class Container {
  private conf: any
  constructor() {
    this.conf = ConfigMgr.get('container', defaultConfig);
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
  abstract run(): void
}