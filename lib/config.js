'use strict';

module.exports = {
  APPROVED_BAUDS: [75, 110, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200],
  APPROVED_PARITIES: ['none', 'odd', 'even', 'space', 'mark'],
  APPROVED_DATABITS: [5, 6, 7, 8, 9],
  APPROVED_STOPBITS: [1, 1.5, 2],
  COLLECTOR_FILEPATH: './collector-files/',
  SCANNER_FILEPATH: './scanner-files/',
  SCAN_SCOPES: {
    common: {

    },
    commonWithBaud: {

    },
    all: {

    }
  }
};