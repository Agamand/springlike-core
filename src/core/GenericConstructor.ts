export interface GenericConstructor extends Function {
  new(): any;
  new(...args: any[]): any;
  (...args: any[]): any;
  prototype: any;
}