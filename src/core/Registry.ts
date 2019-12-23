export class Registry<T>{
  protected data: { [key: string]: T } = {}
  register(dataObject: T, dataName?: String) {

    let name = dataName || (<any>dataObject).name;
    this.data[name] = dataObject;
  }

  get(name: string) {
    return this.data[name];
  }
}


export class ClassRegistry extends Registry<FunctionConstructor> { }

export class InstanceRegistry extends ClassRegistry {

  private instances: { [key: string]: any } = {}

  get(name: string) {

    if (!this.instances[name])
      return this.instances[name] = new this.data[name]();
    return this.instances[name];
  }
}

export const Register = () => {

}