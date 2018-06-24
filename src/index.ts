import ConfigMgr from './core/ConfigMgr';
import Container from './core/Container';
import Utils from './core/Utils';
import { ArchiveUtils, Zip } from './core/ArchiveUtils';
import Service, * as service from './core/Service';
import DataService from './database/DataService';
import CacheService from './core/CacheService';
import RemoteService from './core/RemoteService';
import RESTService, * as RestUtils from './core/RestService';

export = {
  ArchiveUtils,
  CacheService,
  ConfigMgr,
  Container,
  RemoteService,
  RESTService, RestUtils,
  Service,
  service,
  Utils,
  DataService
};