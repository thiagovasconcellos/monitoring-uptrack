const _data = require('../../lib/data');
const { hash } = require('../../lib/hash');
const verifyAuth = require('../../lib/verifyAuth');

_users = {};

_users.GET = function(data, callback) {
  const phone = typeof(data.query.phone) === 'string' && data.query.phone.length > 0 ? data.query.phone.trim() : false;
  if (phone) {

    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

    verifyAuth(token, phone, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read('users', phone, (err, data) => {
          if (!err && data) {
            delete data.password;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {error: 'Authentication required'})
      }
    })
  } else {
    callback(400, { error: 'Phone is not valid'});
  }
};

_users.POST = function(data, callback) {
  const firstName = typeof(data.payload.firstName) === 'string' && 
    data.payload.firstName.trim().length > 0 ?
      data.payload.firstName.trim() :
      false;

  const lastName = typeof(data.payload.lastName) === 'string' && 
    data.payload.lastName.trim().length > 0 ?
      data.payload.lastName.trim() :
      false;

  const phone = typeof(data.payload.phone) === 'string' && 
    data.payload.phone.trim().length > 0 ?
      data.payload.phone.trim() :
      false;

  const password = typeof(data.payload.password) === 'string' && 
    data.payload.password.trim().length > 0 ?
      data.payload.password.trim() :
      false;

  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && 
    data.payload.tosAgreement === true ?
      true :
      false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read('users', phone, (err, data) => {
      if (err) {

        const hashedPassword = hash(password);

        if (!hashedPassword) {
          callback(500, { error: 'Internal Error Server'});
        }

        const userData = {
          firstName,
          lastName,
          phone,
          password: hashedPassword,
          tosAgreement: true
        };

        _data.create('users', phone, userData, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: 'Internal Server Error' });
          }
        })

      } else {
        callback(400, { error: 'User already exists'});
      }
    })
  } else {
    callback(400, { error: 'Missing required fields'});
  }
};

_users.PUT = function(data, callback) {
  const phone = typeof(data.payload.phone) === 'string' && 
    data.payload.phone.trim().length > 0 ?
      data.payload.phone.trim() :
      false;

  const firstName = typeof(data.payload.firstName) === 'string' && 
    data.payload.firstName.trim().length > 0 ?
      data.payload.firstName.trim() :
      false;

  const lastName = typeof(data.payload.lastName) === 'string' && 
    data.payload.lastName.trim().length > 0 ?
      data.payload.lastName.trim() :
      false;

  const password = typeof(data.payload.password) === 'string' && 
    data.payload.password.trim().length > 0 ?
      data.payload.password.trim() :
      false;

  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && 
    data.payload.tosAgreement === true ?
      true :
      false;

  if (phone) {
    if (firstName || lastName || password) {

      const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

      verifyAuth(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {


        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            firstName ? userData.firstName = firstName : userData.firstName;
            lastName ? userData.lastName = lastName : userData.lastName;
            password ? userData.password = hash(password) : userData.password;

            _data.update('users', phone, userData, (err) => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { error: 'Internal Server Error'});
              }
            })
          } else {
          callback(400, { error: 'Invalid user'});
         }
       });
        } else {
          callback(403, { error: 'Authentication required'});
        }
      });
    } else {
      callback(400, { error: 'Missing fields to update'});
    }
  } else {
    callback(400, { error: 'Missing required field'});
  }
};

_users.DELETE = function(data, callback) {

  const phone = typeof(data.query.phone) === 'string' && data.query.phone.length > 0 ? data.query.phone.trim() : false;

  if (phone) {
    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false;

      verifyAuth(token, phone, (tokenIsValid) => {
        if (tokenIsValid) {
          _data.read('users', phone, (err, userData) => {
            if (!err && data) {
              _data.delete('users', phone, (err) => {
                if (!err) {
                  const userChecks = typeof(userData.checks) === 'object' && userData.checks instanceof Array ? userData.checks : [];
                  const checksToDelete = userChecks.length;

                  if (checksToDelete > 0) {
                    let checksDeleted = 0;
                    let deletionErrors = false;
                    userChecks.forEach(checkId => {
                      _data.delete('checks', checkId, (err) => {
                        if (err) {
                          deletionErrors = true;
                        }
                        checksDeleted++;
                        if (checksDeleted === checksToDelete) {
                          if (!deletionErrors) {
                            callback(200);
                          } else {
                            callback(500, { error: 'Internal Server Error'});
                          }
                        }
                      });
                    })
                  } else {
                    callback(200);
                  }
                } else {
                  callback(500, { error: 'Internal Server Error' });
                }
              })
            } else {
              callback(400, { error: 'Could not find the specified user'});
            }
          });
        } else {
          callback(403, {error: 'Authentication required'});
        }
      });
  } else {
    callback(400, { error: 'Phone is not valid'});
  }
};

module.exports = _users;