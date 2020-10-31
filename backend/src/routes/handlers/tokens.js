const _data = require('../../lib/data');
const { hash, compareHash } = require('../../lib/hash');
const createRandomString = require('../../lib/createRandomString');

_tokens = {};

_tokens.GET = function(data, callback) {
  const id = typeof(data.query.id) === 'string' && data.query.id.length > 0 ? data.query.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { error: 'Phone is not valid'});
  }
};

_tokens.POST = function(data, callback) {
  const phone = typeof(data.payload.phone) === 'string' && 
    data.payload.phone.trim().length > 0 ?
      data.payload.phone.trim() :
      false;

  const password = typeof(data.payload.password) === 'string' && 
    data.payload.password.trim().length > 0 ?
      data.payload.password.trim() :
      false;

  if (phone && password) {
    _data.read('users', phone, (err, userData) => {
      if (!err && userData) {
        if (compareHash(password, userData.password)) {
          const tokenId = createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const token = {
            phone,
            tokenId,
            expires
          };

          _data.create('tokens', tokenId, token, (err) => {
            if (!err) {
              callback(200, token);
            } else {
              callback(500, { error: 'Internal Server Error' });
            }
          })
        } else {
          callback(404, { error: 'Password does not match'});
        }
      } else {
        callback(400, {error: 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {error: 'Missing required fields'});
  }
};

_tokens.PUT = function(data, callback) {
  const id = typeof(data.payload.id) === 'string' && data.payload.id.length > 0 ? data.payload.id.trim() : false;
  const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;

  if (id && extend) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        if (data.expires > Date.now()) {
          data.expires = Date.now() + 1000 * 60 * 60;

          _data.update('tokens', id, data, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { error: 'Internal Error Server'})
            }
          })
        } else {
          callback(400, { error: 'Token expired'});
        }
      } else {
        callback(400, {error: 'Specified token does not exist'});
      }
    });
  } else {
    callback(400, { error: 'Missing required fields'});
  }
};

_tokens.DELETE = function(data, callback) {
  const id = typeof(data.query.id) === 'string' && data.query.id.length > 0 ? data.query.id.trim() : false;
  if (id) {
    _data.read('tokens', id, (err, data) => {
      if (!err && data) {
        _data.delete('tokens', id, (err) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { error: 'Internal Server Error' });
          }
        })
      } else {
        callback(400, { error: 'Could not find the specified token'});
      }
    });
  } else {
    callback(400, { error: 'Id is not valid'});
  }
};

module.exports = _tokens;