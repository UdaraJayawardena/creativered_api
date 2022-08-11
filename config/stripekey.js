'use strict';

console.log("ENV : ",process.env.NOD_ENV);

if ('production' === process.env.NOD_ENV) {
  module.exports = require('./keys_prod');
} else {
  module.exports = require('./keys_dev.js');
}
