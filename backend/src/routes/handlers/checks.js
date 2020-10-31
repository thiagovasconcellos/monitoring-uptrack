const _data = require('../../lib/data');
const appConfig = require('../../config');
const createRandomString = require('../../lib/createRandomString');
const verifyAuth = require('../../lib/verifyAuth');

_checks = {};

_checks.GET = function(data, callback) {
  const id = typeof(data.query.id) === 'string' && data.query.id.length > 0 ? data.query.id.trim() : false;
  if (id) {

    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {

        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

        verifyAuth(token, checkData.userPhone, (tokenIsValid) => {
          if (tokenIsValid) {
            callback(200, checkData);
          } else {
            callback(403, {error: 'Authentication required'})
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { error: 'Id is not valid'});
  }
};

_checks.POST = function(data, callback) {
  const protocol = typeof(data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof(data.payload.url) === 'string' && data.payload.url.length > 0 ? data.payload.url : false;
  const method = typeof(data.payload.method) === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof(data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;

        _data.read('users', userPhone, (err, userData) => {
          if (!err && userData) {
            const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];

            if (userChecks.length < appConfig.maxUserChecks) {
              const checkId = createRandomString(20);

              const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds
              };

              _data.create('checks', checkId, checkObject, (err) => {
                if (!err) {
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  _data.update('users', userPhone, userData, (err) => {
                    if (!err) {
                      callback(201, checkObject);
                    } else {
                      callback(500, { error: 'Internal Server Error' });
                    }
                  });
                } else {
                  callback(500, { error: 'Internal Server Error' });
                }
              });

            } else {
              callback(400, { error: `User has reached the maximum number of ${appConfig.maxUserChecks} checks`});
            }
          } else {
            callback(403, {error: 'Not authorized'});
          }
        });
      } else {
        callback(403, { error: 'Not authorized' });
      }
    });
  } else {
    callback(400, { error: 'Missing required inputs or inputs are invalid'});
  }
};

_checks.PUT = function (data, callback) {

  const id = typeof (data.payload.id) === 'string' && data.payload.id.trim().length > 0 ? data.payload.id.trim() : false;

  const protocol = typeof (data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  const url = typeof (data.payload.url) === 'string' && data.payload.url.length > 0 ? data.payload.url : false;
  const method = typeof (data.payload.method) === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  const successCodes = typeof (data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  const timeoutSeconds = typeof (data.payload.timeoutSeconds) === 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
          _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update('checks', id, checkData, (err, data) => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { error: 'Internal Server Error'});
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, {error: 'Check id not found'});
        }
      });
    } else {
      callback(400, { error: 'Missing fields to update' });
    }
  } else {
    callback(400, { error: 'Missing required field' });
  }
};

_checks.DELETE = function(data, callback) {
  const id = typeof(data.query.id) === 'string' && data.query.id.length > 0 ? data.query.id.trim() : false;

  if (id) {
    try {
      _data.read('checks', id, (err, checkData) => {
        if (!err && checkData) {
          const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;
  
          verifyAuth(token, checkData.userPhone, (tokenIsValid) => {
            if (tokenIsValid) {
  
              _data.delete('checks', id, (err) => {
                if (!err) {
                  _data.read('users', checkData.userPhone, (err, userData) => {
                    if (!err && data) {
                      const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                      const checkIndex = userChecks.indexOf(id);
                      if (checkIndex > -1) {
                        userChecks.splice(checkIndex, 1);
  
                        _data.update('users', checkData.userPhone, userData, (err) => {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, { error: 'Internal Server Error'});
                          }
                        });
                      } else {
                        callback(500, { error: 'Internal Server Error'});
                      }
                    } else {
                      callback(400, { error: 'Could not find the specified user'});
                    }
                  });
                } else {
                  callback(500, { error: 'Internal Server Error'});
                }
              });
            } else {
              callback(403, {error: 'Authentication required'});
            }
          });
        } else {
          callback(400, { error: 'The specified check id is not valid'});
        }
      });
    } catch (error) {
      console.error(error);
    }
  } else {
    callback(400, { error: 'Phone is not valid'});
  }
};

module.exports = _checks;