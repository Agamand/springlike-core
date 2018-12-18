export class Registry<T>{
  protected data: { [key: string]: T } = {}
  register(dataObject: T, dataName?: String) {

    let name = (<any>dataObject).name || dataName;
    this.data[name] = dataObject;
  }

  get(name: string) {
    return this.data[name];
  }
}

export class InstanceRegistry extends Registry<FunctionConstructor> {

  private instances: { [key: string]: any } = {}

  get(name: string) {

    if (!this.instances[name])
      return this.instances[name] = new this.data[name]();
    return this.instances[name];
  }
}

export class ClassRegistry extends Registry<FunctionConstructor> {}