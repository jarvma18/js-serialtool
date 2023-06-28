'use strict';

const SerialPort = require('serialport');
const ByteLength = require('@serialport/parser-byte-length');
const fs = require('fs');
const config = require('./config');
const { error } = require('console');

const portPath = process.env.PORT; // path to serialport
const baud = Number(process.env.BAUD); // not used if mode is scan
const parity = process.env.PARITY ? (process.env.PARITY).toLowerCase() : null; // not used if mode is scan
const databits = Number(process.env.DATABITS); // not used if mode is scan
const stopbits = Number(process.env.STOPBITS); // not used if mode is scan
const format = process.env.FORMAT ? (process.env.FORMAT).toLowerCase() : 'decimal';
const toolMode = process.env.MODE ? (process.env.MODE).toLowerCase() : null; // scan, collect, listen
const collectorMaxFile = process.env.COLLECTOR_MAX_FILE ? Number(process.env.COLLECTOR_MAX_FILE) : 10; // kilobytes, not used if mode is scan or listen
const scanScope = process.env.SCAN_SCOPE ? (process.env.SCAN_SCOPE).toLowerCase() : 'common'; // common, common_<baud rate>, all
const maxScan = process.env.MAX_SCAN ? Number(process.env.MAX_SCAN) : 1; // kilobytes, not used if mode is collect or listen
const portParser = process.env.PARSER ? (process.env.PARSER).toLowerCase() : null; // bytelength
const byteLength = process.env.BYTE_LENGTH ? Number(process.env.BYTE_LENGTH) : 10; // number, used when parser is bytelength

let switchScannerPortOptions = false;

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

function mergeScanFiles() {
  let mergeFilePath = config.SCANNER_COMPLETED_FILEPATH + (new Date()).toISOString() + '_scan';
  console.log('Merging files as one', mergeFilePath);
  fs.readdir(config.SCANNER_FILEPATH, (err, files) => {
    if (err) {
      console.log(err);
    }
    else {
      files.forEach(file => {
        fs.readFile(config.SCANNER_FILEPATH + file, function(err, data) {
          if (err) {
            console.log(err);
            return;
          }
          else {
            fs.appendFile(mergeFilePath, file + ':\n' + data.toString() + '\n\n\n', function(err) {
              if (err) {
                console.log(err);
                if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'open' && err.path) {
                  console.log('File not found, creating one');
                  fs.writeFile(mergeFilePath, file + ':\n' + data.toString() + '\n\n\n', function() {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      fs.rm(config.SCANNER_FILEPATH + file, function(err) {
                        if (err) {
                          console.log(err);
                        }
                        else {
                          fs.readdir(config.SCANNER_FILEPATH, (err, files) => {
                            if (err) {
                              console.log(err);
                            }
                            else {
                              if (!files || (files && !files.length)) {
                                process.exit(1);
                              }
                            }
                          });
                        }
                      });
                    }
                  });
                }
              }
              else {
                fs.rm(config.SCANNER_FILEPATH + file, function(err) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    fs.readdir(config.SCANNER_FILEPATH, (err, files) => {
                      if (err) {
                        console.log(err);
                      }
                      else {
                        if (!files || (files && !files.length)) {
                          process.exit(1);
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    }
  });
}

function writeFile(path, data, max, mode) {
  if (!switchScannerPortOptions) {
    fs.appendFile(path, data + '\n', function(err) {
      if (err) {
        console.log(err);
        if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'open' && err.path) {
          console.log('File not found, creating one');
          fs.writeFile(path, data + '\n', function() {
            if (err) {
              console.log(err);
            }
          });
        }
      }
      else {
        let stats = fs.statSync(path);
        let fileSizeInKilobytes = (stats.size) / (1024);
        if (max < fileSizeInKilobytes) {
          console.log('Max data of', max, 'kilobytes written');
          if (mode === 'collect') {
            console.log('Collecting completed, exiting');
            process.exit(1);
          }
          else if (mode === 'scan') {
            switchScannerPortOptions = true;
          }
        }
      }
    });
  }
  else {
    console.log('Serial port options must be switched');
  }
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
    writeFile(collectorFile, dataString, collectorMaxFile, mode);
  }
  else if (mode === 'scan') {
    writeFile(scannerFile, dataString, maxScan, mode);
    if (switchScannerPortOptions) {
      port.close(function(err) {
        if (err) {
          console.log(err);
        }
        else {
          while (port.isOpen) {
            console.log('Port still open, waiting port to close');
          }
          callback();
        }
      });
    }
  }
}

function openPort(path, options, mode, callback) {
  console.log('Trying to open the port');
  const collectorFile = config.COLLECTOR_FILEPATH + (new Date()).toISOString() + '_' + options.baudRate + options.parity + options.dataBits + options.stopBits;
  const scannerFile = config.SCANNER_FILEPATH + options.baudRate + options.parity + options.dataBits + options.stopBits;
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

function listen(b, p, dB, sB, mode, callback) {
  openPort(portPath, { baudRate: b, parity: p, dataBits: dB, stopBits: sB }, mode, function() {
    callback();
  });
}

function scan(scope, bIndex, pIndex, dbIndex, sbIndex) {
  let scopeConfig = null;
  if (scope.split('_')[0] === 'common' && (scope.split('_')).length === 2) {
    scopeConfig = config.SCAN_SCOPES.commonWithBaud;
    scopeConfig.bauds = [Number(scope.split('_')[1])];
  }
  else if (scope === 'common') {
    scopeConfig = config.SCAN_SCOPES.common;
  }
  else if (scope === 'all') {
    scopeConfig = config.SCAN_SCOPES.all;
  }
  else {
    console.log('Scan scope is not valid, scope must be something of common, common_<baudrate> or all');
    return;
  }
  let bauds = scopeConfig.bauds;
  let parities = scopeConfig.parities;
  let databitses = scopeConfig.databitses;
  let stopbitses = scopeConfig.stopbitses;
  let b = bauds[bIndex];
  let p = parities[pIndex];
  let dB = databitses[dbIndex];
  let sB = stopbitses[sbIndex];
  console.log(b, p, dB, sB);
  listen(b, p, dB, sB, 'scan', function() {
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
              mergeScanFiles();
            }
            sbIndex = 0;
          }
        }
      }
    }
    switchScannerPortOptions = false;
    console.log('Switching serial port options');
    scan(scope, bIndex, pIndex, dbIndex, sbIndex);
  });
}

function validatePortPathOption(errorMessages) {
  if (!portPath) {
    errorMessages.push('Empty serialport path option reveiced');
  }
  return errorMessages;
}

function validateModeOptions(errorMessages, mode) {
  const allowedModeOptions = ['listen', 'collect', 'scan'];
  if (!allowedModeOptions.includes(mode)) {
    errorMessages.push('Empty or not allowed mode option received');
  }
  return errorMessages;
}

function validateOptionsForListenOrCollectMode(errorMessages, mode) {
  if (mode !== 'listen' && mode !== 'collect') {
    return errorMessages;
  }
  if (!config.APPROVED_BAUDS.includes(baud)) {
    errorMessages.push('Empty or not allowed baud option received');
  }
  if (!config.APPROVED_PARITIES.includes(parity)) {
    errorMessages.push('Empty or not allowed parity option received');
  }
  if (!config.APPROVED_DATABITS.includes(databits)) {
    errorMessages.push('Empty or not allowed databits option received');
  }
  if (!config.APPROVED_STOPBITS.includes(stopbits)) {
    errorMessages.push('Empty or not allowed stopbits option received');
  }
  return errorMessages;
}

function checkScanScopeForScanMode(mode) {
  if (mode === 'scan' && !scanScope) {
    console.log('Warning: Empty scan scope option received, executing scan with common option');
  }
  return;
}

function validateOptions(mode) {
  let errorMessages = [];
  errorMessages = validatePortPathOption(errorMessages);
  errorMessages = validateModeOptions(errorMessages, mode);
  errorMessages = validateOptionsForListenOrCollectMode(errorMessages, mode);
  if (errorMessages.length) {
    for (const errorMessage of errorMessages) {
      console.log(errorMessage);
    }
    throw new Error('Error: Options are not valid');
  }
  checkScanScopeForScanMode(mode);
  return;
}

function main() {
  validateOptions(toolMode);
  if (toolMode === 'scan') {
    scan(scanScope, 0, 0, 0, 0);
  }
  else {
    listen(baud, parity, databits, stopbits, toolMode, function() {});
  }
}

setTimeout(function() { main(); }, 3000);