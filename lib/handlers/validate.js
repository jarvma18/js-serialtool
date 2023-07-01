'use strict';

const approvedBauds = [75, 110, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const approvedParities = ['none', 'odd', 'even', 'space', 'mark'];
const approvedDatabits = [5, 6, 7, 8, 9];
const approvedStopbits = [1, 1.5, 2];
const allowedModeOptions = ['listen', 'collect', 'scan'];

function validatePortPathOption(errorMessages, portPath) {
  if (!portPath) {
    errorMessages.push('Empty serialport path option reveiced');
  }
  return errorMessages;
}

function validateModeOptions(errorMessages, mode) {
  if (!allowedModeOptions.includes(mode)) {
    errorMessages.push('Empty or not allowed mode option received');
  }
  return errorMessages;
}

function validateOptionsForListenOrCollectMode(errorMessages, mode, baud, parity, databits, stopbits) {
  if (mode !== 'listen' && mode !== 'collect') {
    return errorMessages;
  }
  if (!approvedBauds.includes(baud)) {
    errorMessages.push('Empty or not allowed baud option received');
  }
  if (!approvedParities.includes(parity)) {
    errorMessages.push('Empty or not allowed parity option received');
  }
  if (!approvedDatabits.includes(databits)) {
    errorMessages.push('Empty or not allowed databits option received');
  }
  if (!approvedStopbits.includes(stopbits)) {
    errorMessages.push('Empty or not allowed stopbits option received');
  }
  return errorMessages;
}

function checkScanScopeForScanMode(mode, scanScope) {
  if (mode === 'scan' && !scanScope) {
    console.log('Warning: Empty scan scope option received, executing scan with common option');
  }
  return;
}

exports.validateOptions = function validateOptions(mode, portPath, baud, parity, databits, stopbits, scanScope) {
  let errorMessages = [];
  errorMessages = validatePortPathOption(errorMessages, portPath);
  errorMessages = validateModeOptions(errorMessages, mode);
  errorMessages = validateOptionsForListenOrCollectMode(errorMessages, mode, baud, parity, databits, stopbits);
  if (errorMessages.length) {
    for (const errorMessage of errorMessages) {
      console.log(errorMessage);
    }
    throw new Error('Error: Options are not valid');
  }
  checkScanScopeForScanMode(mode, scanScope);
  return;
}
