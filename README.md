# JSserialtool

1. Listen serialport
2. Listen and collect data from serialport to file
3. Listen and scan serialport data with different port configuration options to file

## How to use

1. npm install
2. <process.env variables here> node index.js

## Process env variables

1. process.env.PORT
  (path to serialport)
2. process.env.BAUD
  (baud rate for serial connection, valid baud rates are 75, 110, 300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200)
3. process.env.PARITY
  (parity for serial communication, valid parities are none, odd, even, space, mark)
4. process.env.DATABITS
  (databits for serial communication, valid databits are 5, 6, 7, 8, 9)
5. process.env.STOPBITS
  (stopbits for serial communcation, valid stopbits are 1, 1.5, 2)
6. process.env.FORMAT
  (format of data from serialport, valid formats are decimal (default) or ascii)
7. process.env.MODE
  (mode of serial communication, valid modes are
    listen (default, console.logs data),
    collect (console.logs data & saves data to file),
    scan (console.logs data & saves data with different serialport options to file))
8. process.env.COLLECTOR_MAX_FILE
  (kilobytes, defines max file size for collector mode file (default 10))
9. process.env.SCAN_SCOPE
  (scan scope defines how widely scan is done, valid scan scopes are common (default), common_<baud rate>, all)
10. process.env.MAX_SCAN
  (kilobytes, defines max scan file size (default 1))
11. process.env.TEST_PORT_PATH
  (path to test serialport to write)
12. process.env.TESTING_DATA
  (text to write from test serialport to listener (default is 'Hello serialport!'))
13. process.env.PARSER
  (define parser to use in collecting data (supporting bytelength))
14. process.env.BYTE_LENGTH
  (define length of data from port when using bytelength as parser)

## Example commands

1. PORT=/dev/ttyS0 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 node index.js

2. PORT=/dev/ttyS0 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=listen FORMAT=ascii node index.js

3. PORT=/dev/ttyS0 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=collect FORMAT=decimal node index.js

4. PORT=/dev/ttyS0 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=collect FORMAT=ascii node index.js

5. PORT=/dev/ttyS0 MODE=scan FORMAT=ascii node index.js

6. PORT=/dev/ttyS0 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=listen PARSER=bytelength BYTE_LENGTH=10 FORMAT=ascii node index.js

## How to test with virtual serial ports in Linux

1. Install socat: https://www.redhat.com/sysadmin/getting-started-socat
2. In terminal: socat -d -d pty,raw,echo=0 pty,raw,echo=0

Socat prints the virtual ports:

2021/11/30 21:22:46 socat[4181] N PTY is /dev/pts/2\
2021/11/30 21:22:46 socat[4181] N PTY is /dev/pts/3\
2021/11/30 21:22:46 socat[4181] N starting data transfer loop with FDs [5,5] and [7,7]

3. Testing port for write is /dev/pts/2
4. Port to listen is /dev/pts/3
6. Test with these commands:

TEST_PORT_PATH=/dev/pts/2 PORT=/dev/pts/3 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=listen FORMAT=ascii node index.js

TEST_PORT_PATH=/dev/pts/2 PORT=/dev/pts/3 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=collect FORMAT=ascii node index.js

TEST_PORT_PATH=/dev/pts/2 PORT=/dev/pts/3 BAUD=9600 PARITY=none DATABITS=8 STOPBITS=1 MODE=scan FORMAT=ascii node index.js

## TODO

1. Testing
2. Testing
3. Testing