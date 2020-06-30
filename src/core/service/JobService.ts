import { Service } from "../decorators";
import { LOGGER } from "../Constant";




export type JobTask = () => Promise<any>;

@Service
export class CronJobService {

  tasks: { [key: string]: { timeout: NodeJS.Timeout, job: JobTask } } = {};
  
  timer(time: number, staticTimer: boolean = false) {
    if (staticTimer) {
      let date = new Date();
      date.setMilliseconds(0);
      date.setSeconds(0);
      date.setMinutes(0);
      date.setHours(0);
      let diff = (new Date().getTime() - date.getTime());
      let remaining = time - (diff % time);
      
      let minute = Math.floor(remaining/60000);
      let seconds = Math.floor((remaining-minute*60000)/1000);
      LOGGER.debug(`NEXT timer is in ${minute} minutes and ${seconds} seconds`);
      
      return remaining;
    }
    return time + (1 - Math.random() * 2) * (time / 10)
  }

  /**
   *
   *
   * @param {string} name the job name
   * @param {JobTask} job an async lamba expression
   * @param {number} time Time in milliseconds
   * @returns
   * @memberof CronJobService
   */


  addJob(name: string, job: JobTask, time: number, staticTimer: boolean = false) {
    if (this.tasks[name])
      return;
    let task = () => {
      return job().finally(() => {
        if (this.tasks[name].timeout)
          clearTimeout(this.tasks[name].timeout);
        this.tasks[name].timeout = setTimeout(task, this.timer(time, staticTimer))
      })
    }
    this.tasks[name] = { timeout: setTimeout(task, this.timer(time, staticTimer)), job: task }
  }


  

  async forceJob(name: string) {
    if (!this.tasks[name]) {
      return;
    }
    let task = this.tasks[name];
    if (task.timeout)
      clearTimeout(task.timeout);
    await task.job();
  }


}