'use strict';

const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
const config = require('../config');
const file = require('./file');

const portParser = process.env.PARSER ? (process.env.PARSER).toLowerCase() : null; // bytelength
const byteLength = process.env.BYTE_LENGTH ? Number(process.env.BYTE_LENGTH) : 10; // number, used when parser is bytelength
const format = process.env.FORMAT ? (process.env.FORMAT).toLowerCase() : 'decimal';
const collectorMaxFile = process.env.COLLECTOR_MAX_FILE ? Number(process.env.COLLECTOR_MAX_FILE) : 10; // kilobytes, not used if mode is scan or listen
const maxScan = process.env.MAX_SCAN ? Number(process.env.MAX_SCAN) : 1; // kilobytes, not used if mode is collect or listen
const portPath = process.env.PORT; // path to serialport

let switchScannerPortOptions = false;

function createFileName(defaultFilePath, baudRate, parity, dataBits, stopBits) {
  const date = new Date().toISOString();
  return defaultFilePath + date + '_' + baudRate + parity + dataBits + stopBits;
}

function closePortWhenSwitchingScan(port, callback) {
  port.close(function(err) {
    if (err) {
      console.log(err);
    }
    else {
      while (port.isOpen) {
        console.log('Port still open, waiting port to close');
      }
      callback();
    }
  });
}

function collectData(data, mode, scannerFile, collectorFile, port, callback) {
  let dataFromBuffer = [...data];
  let dataString = '';
  for (let i = 0; i < dataFromBuffer.length; i++) {
    if (format === 'decimal') {
      dataString += dataFromBuffer[i];
      dataString += ' ';
    }
    else if (format === 'ascii') {
    dataString += String.fromCharCode(dataFromBuffer[i]);
    }
  }
  console.log(dataString);
  if (mode === 'collect') {
    switchScannerPortOptions = file.write(collectorFile, dataString, collectorMaxFile, mode);
  }
  else if (mode === 'scan') {
    writeFile(scannerFile, dataString, maxScan, mode);
    if (switchScannerPortOptions) {
      closePortWhenSwitchingScan(port, callback);
    }
  }
}

function startListeningPort(portParser, parser, mode, scannerFile, collectorFile, port, callback) {
  if (portParser === 'bytelength') {
    parser.on('data', function(data) {
      collectData(data, mode, scannerFile, collectorFile, port, function() {
        callback();
      });
    });
  }
  else {
    port.on('data', function(data) {
      collectData(data, mode, scannerFile, collectorFile, port, function() {
        callback();
      });
    });
  }
}

function openPort(path, options, mode, callback) {
  console.log('Trying to open the port');
  const collectorFile = createFileName(config.COLLECTOR_FILEPATH, options.baudRate, options.parity, options.dataBits, options.stopBits);
  const scannerFile = createFileName(config.SCANNER_FILEPATH, options.baudRate, options.parity, options.dataBits, options.stopBits);
  const port = new SerialPort(path, options);
  const parser = portParser === 'bytelength' ? port.pipe(new ByteLength({length: byteLength})) : null;
  port.on('open', function() {
    console.log('Port opened');
  });
  port.on('close', function() {
    console.log('Port closed');
  });
  port.on('error', function(err) {
    console.log('Port errored:', err);
  });
  startListeningPort(portParser, parser, mode, scannerFile, collectorFile, port, callback);
}

function scanCallbackFunctionForListen(scope, bauds, parities, databitses, stopbitses, bIndex, pIndex, dbIndex, sbIndex) {
  let optionIndexes = [bauds.length - 1, parities.length - 1, databitses.length - 1, stopbitses.length - 1];
  let bIndexOld = bIndex;
  let pIndexOld = pIndex;
  let dbIndexOld = dbIndex;
  let sbIndexOld = sbIndex;
  if (bIndex === bIndexOld) {
    // all bauds
    pIndex = (pIndex < parities.length - 1) ? pIndex + 1 : pIndex;
    if (pIndex === pIndexOld) {
      // all parities
      pIndex = 0;
      dbIndex = (dbIndex < databitses.length - 1) ? dbIndex + 1 : dbIndex;
      if (dbIndex === dbIndexOld) {
        // all databits
        dbIndex = 0;
        sbIndex = (sbIndex < stopbitses.length - 1) ? sbIndex + 1 : sbIndex;
        if (sbIndex === sbIndexOld) {
          // all stopbits
          bIndex = (bIndex < bauds.length - 1) ? bIndex + 1 : bIndex;
          if (optionIndexes[0] === bIndexOld && optionIndexes[1] === pIndexOld && optionIndexes[2] === dbIndexOld && optionIndexes[3] === sbIndexOld) {
            file.mergeScanFiles();
          }
          sbIndex = 0;
        }
      }
    }
  }
  switchScannerPortOptions = false;
  console.log('Switching serial port options');
  scan(scope, bIndex, pIndex, dbIndex, sbIndex);
}

function setScanScope(scope) {
  let scopeConfig = null;
  if (scope.split('_')[0] === 'common' && (scope.split('_')).length === 2) {
    scopeConfig = config.SCAN_SCOPES.commonWithBaud;
    scopeConfig.bauds = [Number(scope.split('_')[1])];
  }
  else if (scope === 'all') {
    scopeConfig = config.SCAN_SCOPES.all;
  }
  else {
    scopeConfig = config.SCAN_SCOPES.common;
  }
  return scopeConfig;
}

exports.scan = function scan(scope, bIndex, pIndex, dbIndex, sbIndex) {
  let scopeConfig = setScanScope(scope);
  let bauds = scopeConfig.bauds;
  let parities = scopeConfig.parities;
  let databitses = scopeConfig.databitses;
  let stopbitses = scopeConfig.stopbitses;
  let b = bauds[bIndex];
  let p = parities[pIndex];
  let dB = databitses[dbIndex];
  let sB = stopbitses[sbIndex];
  console.log(b, p, dB, sB);
  connection.listen(b, p, dB, sB, 'scan', scanCallbackFunctionForListen(scope, bauds, parities, databitses, stopbitses, bIndex, pIndex, dbIndex, sbIndex));
}

exports.listen = function listen(b, p, dB, sB, mode, callback) {
  openPort(portPath, { baudRate: b, parity: p, dataBits: dB, stopBits: sB }, mode, function() {
    callback();
  });
}