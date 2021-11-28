'use strict';

require('./lib/tool');
if (process.env.TEST_PORT_PATH) {
  require('./lib/tester');
}