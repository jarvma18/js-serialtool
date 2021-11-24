'use strict';

require('./lib/tool');
if (process.env.TEST === 'true') {
  require('./lib/tester');
}