const fs = require('fs');
const Path = require('path');
const zlib = require('zlib');

const path = Path.resolve(__dirname, '..', '.logs');

const logs = {
  append: (fileName, data, callback) => {
    fs.open(`${path}/${fileName}.log`, 'a', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        fs.appendFile(fileDescriptor, `${data}\n`, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing the file');
              }
            });
          } else {
            callback('Error appending to file');
          }
        })
      } else {
        callback('Could not open file');
      }
    })
  },
  list: (includeCompressedLogs, callback) => {
    fs.readdir(path, (err, data) => {
      if (!err & data) {
        const trimmedNames = [];
        data.forEach(fileName => {
          if (fileName.indexOf('.log') > -1) {
            trimmedNames.push(fileName.replace('.log', ''));
          }

          if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
            trimmedNames.push(fileName.replace('.gz.b64', ''));
          }
        });
        callback(false, trimmedNames);
      } else {
        callback(err, data);
      }
    });
  },
  compress: (logId, newFileId, callback) => {
    const sourceFile = `${logId}.log`;
    const destinationFile = `${newFileId}.gz.b64`;

    fs.readFile(`${path}/${sourceFile}`, 'utf8', (err, inputString) => {
      if (!err && inputString) {
        zlib.gzip(inputString, (err, buffer) => {
          if (!err && buffer) {
            fs.open(`${path}/${destinationFile}`, 'wx', (err, fileDescriptor) => {
              if (!err && fileDescriptor) {
                fs.writeFile(fileDescriptor, buffer.toString('base64'), (err) => {
                  if (!err) {
                    fs.close(fileDescriptor, (err) => {
                      if (!err) {
                        callback(false);
                      } else {
                        callback(err);
                      }
                    });
                  } else {
                    callback(err);
                  }
                });
              } else {
                callback(err);
              }
            });
          } else {
            callback(err);
          }
        });
      } else {
        callback(err);
      }
    });
  },
  decompress: (fileId, callback) => {
    const fileName = `${fileId}.gz.b64`;
    fs.readFile(`${path}/${fileName}`, 'utf8', (err, str) => {
      if (!err && str) {
        const inputBuffer = Buffer.from(str, 'base64');
        zlib.unzip(inputBuffer, (err, outputBuffer) => {
          if (!err && outputBuffer) {
            callback(false, outputBuffer.toString());
          } else {
            callback(err);
          }
        });
      } else {
        callback(err);
      }
    });
  },
  truncate: (logId, callback) => {
    fs.truncate(`${path}/${logId}.log`, 0, (err) => {
      if (!err) {
        callback(false);
      } else {
        callback(err);
      }
    });
  }
}

module.exports = logs;