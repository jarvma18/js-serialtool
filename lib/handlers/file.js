'use strict';

const fs = require('fs');
const config = require('../config');

let switchScannerPortOptions = false;

function checkThatTmpScannerFilesAreGoneAndExit(err) {
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
}

function removeFileAfterWritingOrLogError(err, file) {
  if (err) {
    console.log(err);
  }
  else {
    fs.rm(config.SCANNER_FILEPATH + file, (err) => checkThatTmpScannerFilesAreGoneAndExit(err));
  }
}

function writeMergeFileAndRemoveIt(mergeFilePath, file, err, data) {
  if (err) {
    console.log(err);
    if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'open' && err.path) {
      console.log('File not found, creating one');
      fs.writeFile(mergeFilePath, file + ':\n' + data.toString() + '\n\n\n', (err) => removeFileAfterWritingOrLogError(err, file));
    }
  }
  else {
    fs.rm(config.SCANNER_FILEPATH + file, (err) => checkThatTmpScannerFilesAreGoneAndExit(err));
  }
}

function appendOrWriteMergeFilesAndRemoveFile(mergeFilePath, file, err, data) {
  if (err) {
    console.log(err);
    return;
  }
  else {
    fs.appendFile(mergeFilePath, file + ':\n' + data.toString() + '\n\n\n', (err) => writeMergeFileAndRemoveIt(mergeFilePath, file, err, data));
  }
}

function appendOrWriteToFileWhenMergingScanFilesFileByFile(err, files, mergeFilePath) {
  if (err) {
    console.log(err);
  }
  else {
    files.forEach(file => {
      fs.readFile(config.SCANNER_FILEPATH + file, (err, data) => appendOrWriteMergeFilesAndRemoveFile(mergeFilePath, file, err, data));
    });
  }
}

function writeFileIfCannotAppend(err, path, data) {
  if (err.errno === -2 && err.code === 'ENOENT' && err.syscall === 'open' && err.path) {
    console.log('File not found, creating one');
    fs.writeFile(path, data + '\n', function() {
      if (err) {
        console.log(err);
      }
    });
  }
}

function switchScannerOptsOrExitWhenCollecting(mode) {
  if (mode === 'collect') {
    console.log('Collecting completed, exiting');
    process.exit(1);
  }
  else if (mode === 'scan') {
    switchScannerPortOptions = true;
  }
}

function appendOrWriteToFile(path, data, max, mode) {
  fs.appendFile(path, data + '\n', function(err) {
    if (err) {
      console.log(err);
      writeFileIfCannotAppend(err, path, data);
    }
    else {
      let stats = fs.statSync(path);
      let fileSizeInKilobytes = (stats.size) / (1024);
      if (max < fileSizeInKilobytes) {
        console.log('Max data of', max, 'kilobytes written');
        switchScannerOptsOrExitWhenCollecting(mode);
      }
    }
  });
}

exports.write = function write(path, data, max, mode) {
  if (!switchScannerPortOptions) {
    appendOrWriteToFile(path, data, max, mode);
  }
  else {
    console.log('Serial port options must be switched');
  }
  return switchScannerPortOptions;
}

exports.mergeScanFiles = function mergeScanFiles() {
  let mergeFilePath = config.SCANNER_COMPLETED_FILEPATH + (new Date()).toISOString() + '_scan';
  console.log('Merging files as one', mergeFilePath);
  fs.readdir(config.SCANNER_FILEPATH, (err, files) => appendOrWriteToFileWhenMergingScanFilesFileByFile(err, files, mergeFilePath));
}