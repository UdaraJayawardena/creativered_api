'use strict';

if ('production' === process.env.NOD_ENV) {
  module.exports = require('./keys_prod');
} else {
  module.exports = require('./keys_dev.js');
}
