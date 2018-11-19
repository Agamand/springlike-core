import log4js from 'log4js';
import { EventEmitter } from "events";
export const LOGGER = log4js.getLogger();
export const GlobalEmitter = new EventEmitter();