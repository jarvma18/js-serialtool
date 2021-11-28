'use strict';

const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
const fs = require('fs');
const config = require('./config');

const portPath = process.env.PORT; // path to serialport
const baud = Number(process.env.BAUD); // not used if mode is scan
const parity = process.env.PARITY ? (process.env.PARITY).toLowerCase() : null; // not used if mode is scan
const databits = Number(process.env.DATABITS); // not used if mode is scan
const stopbits = Number(process.env.STOPBITS); // not used if mode is scan
const mode = process.env.MODE ? (process.env.MODE).toLowerCase() : null; // scan, collect, listen
const collectorMaxFile = process.env.COLLECTOR_MAX_FILE ? Number(process.env.COLLECTOR_MAX_FILE) : 10; // kilobytes, not used if mode is scan or listen
const scanScope = process.env.SCAN_SCOPE ? (process.env.SCAN_SCOPE).toLowerCase() : null; // common, common_<baud rate>, all
const maxScan = process.env.MAX_SCAN ? Number(process.env.MAX_SCAN) : 1; // kilobytes, not used if mode is collect or listen

function openOrModifyPort(path, options, mode) {
  const collectorFile = config.COLLECTOR_FILEPATH + (new Date()).toISOString() + '_' + options.baudRate + options.parity + options.dataBits + options.stopBits;
  const port = new SerialPort(path, options);

  port.on('open', function() {
    console.log('Port opened');
  });
  
  port.on('close', function() {
    console.log('Port closed');
  });
  
  port.on('error', function(err) {
    console.log('Port errored:', err);
  });
  
  port.on('data', function(data) {
    let dataFromBuffer = [...data];
    let dataString = '';
    for (let i = 0; i < dataFromBuffer.length; i++) {
      dataString += dataFromBuffer[i];
      dataString += ' ';
    }
    console.log(dataString);
    if (mode === 'collect') {
      fs.appendFile(collectorFile, dataString, function(err) {
        if (err) {
          console.log(err);
          if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'open' && err.path) {
            console.log('File not found, creating one');
            fs.writeFile(collectorFile, dataString, function() {
              if (err) {
                console.log(err);
              }
            });
          }
        }
      });
    }
  });
}

function listen(b, p, dB, sB, mode) {
  openOrModifyPort(portPath, { baudRate: b, parity: p, dataBits: dB, stopBits: sB }, mode);
}

function checkOptions(mode) {
  let isValidOptions = true;
  if (!portPath) {
    isValidOptions = false;
    console.log('Error: Empty serialport path option reveiced');
  }
  if (mode === 'listen' || mode === 'collect') {
    if (!config.APPROVED_BAUDS.includes(baud) || !config.APPROVED_PARITIES.includes(parity) ||
        !config.APPROVED_DATABITS.includes(databits) || !config.APPROVED_STOPBITS.includes(stopbits)) {
      isValidOptions = false;
      console.log('Error: Check port options (baud, parity, databits, stopbits)\n')
      console.log('Valid values are:');
      console.log('For BAUD: ', config.APPROVED_BAUDS);
      console.log('For PARITY: ', config.APPROVED_PARITIES);
      console.log('For DATABITS: ', config.APPROVED_DATABITS);
      console.log('For STOPBITS: ', config.APPROVED_STOPBITS, '\n');
    }
  }
  else if (mode === 'scan') {
    if (!scanScope) {
      console.log('Warning: Empty scan scope option received, executing scan with common option');
      scanScope = 'common';
    }
  }
  else {
    console.log('Error: Check mode options, valid values are (scan, collect, listen)');
    isValidOptions = false;
  }
  return isValidOptions;
}

console.log('Tool starting');

switch (mode) {
  case 'scan':
    console.log('Tool starting with scan mode');
    if (checkOptions(mode)) {
      console.log('Options OK');
    }
    else {
      console.log('Missing options at start');
      console.log('Exiting');
    }
    break;
  case 'collect':
    console.log('Tool starting with collect mode');
    if (checkOptions(mode)) {
      console.log('Options OK');
      listen(baud, parity, databits, stopbits, mode);
    }
    else {
      console.log('Missing options at start');
      console.log('Exiting');
    }
    break;
  default:
    console.log('Tool starting with listen mode (default)');
    if (checkOptions('listen')) {
      console.log('Options OK');
      listen(baud, parity, databits, stopbits, 'listen');
    }
    else {
      console.log('Missing options at start, test with this for example: PORT=<port you want to listen> BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 node index.js');
      console.log('Exiting');
    }
    break;
}