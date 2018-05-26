const Conf = require('./core/Conf'),
  Service = require('./core/Service'),
  Utils = require('./core/Utils');
Service.load(/.+Service\.js$/, __dirname);

module.exports = {
  Service,
  Conf,
  Utils
};