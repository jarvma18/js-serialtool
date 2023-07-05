'use strict';

const fs = require('fs');
const config = require('./config');
const validate = require('./handlers/validate');
const connection = require('./handlers/connection');

const portPath = process.env.PORT; // path to serialport
const baud = Number(process.env.BAUD); // not used if mode is scan
const parity = process.env.PARITY ? (process.env.PARITY).toLowerCase() : null; // not used if mode is scan
const databits = Number(process.env.DATABITS); // not used if mode is scan
const stopbits = Number(process.env.STOPBITS); // not used if mode is scan
const toolMode = process.env.MODE ? (process.env.MODE).toLowerCase() : null; // scan, collect, listen
const scanScope = process.env.SCAN_SCOPE ? (process.env.SCAN_SCOPE).toLowerCase() : 'common'; // common, common_<baud rate>, all

function makeDir(dirName) {
  fs.mkdir(dirName, function(err) {
    if (err) {
        return console.error(err);
    }
    console.log('Directory ', dirName, 'created succesfully');
  });
}
makeDir(config.COLLECTOR_FILEPATH);
makeDir(config.SCANNER_FILEPATH);
makeDir(config.SCANNER_COMPLETED_FILEPATH);

function main() {
  try {
    validate.validateOptions(toolMode, portPath, baud, parity, databits, stopbits, scanScope);
    if (toolMode === 'scan') {
      connection.scan(scanScope, 0, 0, 0, 0);
    }
    else {
      connection.listen(baud, parity, databits, stopbits, toolMode, function() {});
    }
  }
  catch (err) {
    console.log(err);
  }
}

setTimeout(function() { main(); }, 3000);