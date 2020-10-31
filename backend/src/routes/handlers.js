const _users = require('./handlers/users');
const _tokens = require('./handlers/tokens');
const _checks = require('./handlers/checks');

module.exports = {
  ping: function(data, callback) {
    callback(200);
  },
  users: function(data, callback) {
    const acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    if (acceptableMethods.indexOf(data.method) !== -1) {
      _users[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  tokens: function(data, callback) {
    const acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    if (acceptableMethods.indexOf(data.method) !== -1) {
      _tokens[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  checks: function(data, callback) {
    const acceptableMethods = ['GET', 'POST', 'PUT', 'DELETE'];

    if (acceptableMethods.indexOf(data.method) !== -1) {
      _checks[data.method](data, callback);
    } else {
      callback(405);
    }
  },
  notFound: function(data, callback) {
    data.error = 'Path does not exist';
    callback(404, data ? data : { error: 'not found' });
  }
}