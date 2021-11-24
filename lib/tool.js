'use strict';

const serialport = require('serialport');
const config = require('./config');

const baud = Number(process.env.BAUD); // not used if mode is scan
const parity = process.env.PARITY ? (process.env.PARITY).toLowerCase() : null; // not used if mode is scan
const databits = Number(process.env.DATABITS); // not used if mode is scan
const stopbits = Number(process.env.STOPBITS); // not used if mode is scan
const mode = process.env.MODE ? (process.env.MODE).toLowerCase() : null; // scan, collect, listen
const scanScope = process.env.SCAN_SCOPE ? (process.env.SCAN_SCOPE).toLowerCase() : null; // common, common_<baud rate>, all
const collectorMaxFile = Number(process.env.COLLECTOR_MAX_FILE); // kilobytes, not used if mode is scan or listen
const scannerMaxFile = Number(process.env.SCANNER_MAX_FILE); // kilobytes, not used if mode is collect or listen

function checkOptions(mode) {
  let isValidOptions = false;
  if (mode === 'listen' || mode === 'collect') {
    if (!config.APPROVED_BAUDS.includes(baud) || !config.APPROVED_PARITIES.includes(parity) ||
        !config.APPROVED_DATABITS.includes(databits) || !config.APPROVED_STOPBITS.includes(stopbits)) {
      isValidOptions = false;
      console.log('Check port options (baud, parity, databits, stopbits)')
      console.log('Valid values are:');
      console.log('Baud: ', config.APPROVED_BAUDS);
      console.log('Parity: ', config.APPROVED_PARITIES);
      console.log('Databits: ', config.APPROVED_DATABITS);
      console.log('Stopbits: ', config.APPROVED_STOPBITS);
    }
    if (mode === 'collect') {
      if (!collectorMaxFile) {
        console.log('Empty collector max file size options received, assigning default 10 kilobytes');
        collectorMaxFile = 10;
      }
    }
  }
  else if (mode === 'scan') {

  }
  else {
    console.log('Check mode options, valid values are (scan, collect, listen)');
    isValidOptions = false;
    return isValidOptions;
  }
}

console.log('Tool starting');

switch (mode) {
  case 'scan':
    console.log('Tool starting with scan mode');
    if (checkOptions(mode)) {
      console.log('Options OK');
    }
    else {
      console.log('Exiting');
    }
    break;
  case 'collect':
    console.log('Tool starting with collect mode');
    if (checkOptions(mode)) {
      console.log('Options OK');
    }
    else {
      console.log('Exiting');
    }
    break;
  default:
    console.log('Tool starting with listen mode');
    if (checkOptions('listen')) {
      console.log('Options OK');
    }
    else {
      console.log('Exiting');
    }
    break;
}