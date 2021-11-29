'use strict';

const SerialPort = require('serialport');

// implement tester that writes data to virtual serial port ti test the tool
console.log('Tester starting');

const port = new SerialPort(process.env.TEST_PORT_PATH, { baudRate: 9600, parity: 'none', dataBits: 8, stopBits: 1 });

setInterval(function() {
  port.write('   3570G', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
  })
}, 10);