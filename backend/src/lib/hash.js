const crypto = require('crypto');
const config = require('../config');

module.exports =  {
  hash: (password) => {
    if (typeof(password) === 'string' && password.length > 0) {
      const hash = crypto.createHmac('sha256', config.hashSecret).update(password).digest('hex');
      return hash;
    } else {
      return false;
    }
  },
  compareHash: (password, hashedPassword) => {
    if (typeof(password) === 'string' && password.length > 0) {
      const hash = crypto.createHmac('sha256', config.hashSecret).update(password).digest('hex');
      if (hash !== hashedPassword) {
        return false;
      }
      return true;
    } else {
      return false;
    }
  }
};