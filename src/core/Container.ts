import cluster from 'cluster';
import {ConfigMgr} from './ConfigMgr';
/* application container*/
const defaultConfig = {
  cluster: 0
}
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