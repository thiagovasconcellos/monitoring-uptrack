const _data = require('./data');
const https = require('https');
const http = require('http');
const url = require('url');
const _logs = require('./logs');
const util = require('util');

const debug = util.debuglog('workers')

const sendTwilioSms = require('./sendTwilioSms');

const workers = {
  log: (checkData, outcome, state, alertWarranted, timeOfCheck) => {
    const logData = {
      check: checkData,
      outcome,
      state,
      alert: alertWarranted,
      time: timeOfCheck
    };

    const logString = JSON.stringify(logData);

    const logFileName = `${checkData.id}`;

    _logs.append(logFileName, logString, (err) => {
      if (!err) {
        debug('Logging succeeded');
      } else {
        debug('Logging failed');
      }
    });
  },
  alertUserStatusChange: (checkData) => {
    const msg = `Alert: Your check to [${checkData.method}]-${checkData.protocol}://${checkData.url} is currently ${checkData.state}`

    sendTwilioSms(checkData.userPhone, msg, (err) => {
      if (!err) {
        debug('Succeeded');
      } else {
        debug(err);
      }
    });
  },
  processCheckOutcome: (checkData, outcome) => {
    const state = !outcome.error && outcome.responseCode && checkData.successCodes.indexOf(outcome.responseCode > -1) ? 'up' : 'down';

    const alertWarranted = checkData.lastChecked && checkData.state !== state ? true : false;

    const newCheckData = checkData;
    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    _data.update('checks', newCheckData.id, newCheckData, (err) => {
      if (!err) {
        if (alertWarranted) {
          workers.alertUserStatusChange(newCheckData);
        } else {
          debug('No changes to alert');
        }
      } else {
        debug(err);
      }
    });

    workers.log(checkData, outcome, state, alertWarranted, Date.now());
  },
  performCheck: (checkData) => {
    let checkOutcome = {
      error: false,
      responseCode: false
    };

    let outcomeSent = false;

    const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true);
    const { hostname, path } = parsedUrl;

    const requestDetails = {
      protocol: `${checkData.protocol}:`,
      hostname,
      method: checkData.method,
      path,
      timeout: checkData.timeoutSeconds * 1000
    };

    const _module = checkData.protocol == 'htpp'? http : https;

    const request = _module.request(requestDetails, (res) => {
      checkOutcome.responseCode = res.statusCode;

      if (!outcomeSent) {
        workers.processCheckOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });

    request.on('error', (err) => {
      checkOutcome.error = {
        error: true,
        value: err
      };

      if (!outcomeSent) {
        workers.processCheckOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });

    request.on('timeout', (err) => {
      checkOutcome.error = {
        error: true,
        value: 'timeout'
      };

      if (!outcomeSent) {
        workers.processCheckOutcome(checkData, checkOutcome);
        outcomeSent = true;
      }
    });

    request.end();
  },
  validateCheckData: (checkData) => {
    checkData = typeof(checkData) === 'object' && checkData !== null ? checkData : {};

    checkData.id = typeof(checkData.id) === 'string' ? checkData.id : false;

    checkData.userPhone = typeof(checkData.userPhone) === 'string' ? checkData.userPhone : false;
    checkData.protocol = typeof(checkData.protocol) === 'string' 
      && ['http', 'https'].indexOf(checkData.protocol) > -1 ? 
      checkData.protocol : false;

    checkData.url = typeof(checkData.url) === 'string' ? checkData.url : false;

    checkData.method = typeof(checkData.method) === 'string' &&
      ['POST', 'GET', 'PUT', 'DELETE'].indexOf(checkData.method) > -1 ? 
      checkData.method : false;

    checkData.successCodes = typeof(checkData.successCodes) === 'object' && 
      checkData.successCodes instanceof Array ? 
      checkData.successCodes : false;

    checkData.timeoutSeconds = typeof(checkData.timeoutSeconds) === 'number' ? checkData.timeoutSeconds : false;

    checkData.state = typeof(checkData.state) === 'string' 
      && ['up', 'down'].indexOf(checkData.state) > -1 ? 
      checkData.state : 'down';

    checkData.lastChecked = typeof(checkData.lastChecked) === 'number' && checkData.lastChecked > 0 ? checkData.lastChecked : false;

    if(checkData.id && checkData.userPhone && checkData.protocol &&
        checkData.url && checkData.method && checkData.successCodes && checkData.timeoutSeconds) {
          workers.performCheck(checkData);
        } else {
          debug(error)
        }
  },
  gatherAllChecks: () => {
    _data.list('checks', (err, checks) => {
      if (!err && checks && checks.length > 0) {
        checks.forEach(check => {
          _data.read('checks', check, (err, originalCheckData) => {
            if (!err && originalCheckData) {
              workers.validateCheckData(originalCheckData);
            } else {
              debug('Error reading one of the checks data');
            }
          });
        });
      } else {
        debug('Error could not find any checks to process');
      }
    })
  },
  loop: () => {
    setInterval(() => {
      workers.gatherAllChecks();
    }, 1000 * 60);
  },
  rotateLogs: () => {
    _logs.list(false, (err, logs) => {
      if (!err && logs && logs.length > 0) {
        logs.forEach(logName => {
          if (logName === '.gitkeep') {
            return;
          }
          const logId = logName.replace('.log', '');
          const newFileId = `${logId}-${Date.now()}`;

          _logs.compress(logId, newFileId, (err) => {
            if (!err) {
              _logs.truncate(logId, (err) => {
                if (!err) {
                  debug('Succeeded');
                } else {
                  debug('Error truncating file');
                }
              });
            } else {
              debug('Error compressing files', err);
            }
          });
        });
      } else {
        debug('Could not find any logs to rotate');
      }
    });
  },
  logRotationLoop: () => {
    setInterval(() => {
      workers.rotateLogs();
    }, 1000 * 60 * 60 * 24);
  },
  init: () => {
    console.log('\x1b[33m%s\x1b[0m','Background workers are running');
    workers.gatherAllChecks();
    workers.loop();
    workers.rotateLogs();
    workers.logRotationLoop();
  },
};

workers.init();

module.exports = workers;
