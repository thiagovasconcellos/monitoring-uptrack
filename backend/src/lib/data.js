const fs = require('fs');
const Path = require('path');

const parseJsonToObject = require('./parseJsonToObject');

const path = Path.resolve(__dirname, '..', '.data');

module.exports = {
  create: (dir, file, data, callback) => {
    fs.open(`${path}/${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {

        const stringData = JSON.stringify(data);
        
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing file');
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
      }
    });
  },
  read: (dir, file, callback) => {
    fs.readFile(`${path}/${dir}/${file}.json`, 'utf8', (err, data) => {
      if (!err && data) {
        const parsedData = parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    })
  },
  update: (dir, file, data, callback) => {
    fs.open(`${path}/${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        const stringData = JSON.stringify(data);
        fs.ftruncate(fileDescriptor, (err) => {
          if (!err) {
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing file');
                  }
                });
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Not able to truncate file');
          }
        });
      } else {
        callback('Could not open file for update')
      }
    });
  },
  delete: (dir, file, callback) => {
    fs.unlink(`${path}/${dir}/${file}.json`, (err) => {
      if (!err) {
        callback(false);
      } else {
        callback(err);
      }
    });
  },
  list: (dir, callback) => {
    fs.readdir(`${path}/${dir}/`, (err, data) => {
      if (!err && data && data.length > 0) {
        const trimmedFileNames = [];
        data.forEach(file => {
          if (file === '.gitkeep') {
            return ;
          }
          trimmedFileNames.push(file.replace('.json', ''));
        });

        callback(false, trimmedFileNames);
      }
      else {
        callback(err);
      }
    });
  },
}