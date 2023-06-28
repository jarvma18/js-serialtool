'use strict';

const SerialPort = require('serialport');

// implement tester that writes data to virtual serial port to test the tool
console.log('Tester starting');

const testingData = process.env.TESTING_DATA ? process.env.TESTING_DATA : 'Hello serialport!';
const port = new SerialPort(process.env.TEST_PORT_PATH, { baudRate: 9600, parity: 'none', dataBits: 8, stopBits: 1 });

setInterval(function() {
  port.write(testingData, function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  })
}, 10);