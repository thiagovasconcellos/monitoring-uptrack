module.exports = function(length) {
  length = typeof(length) === 'number' && length > 0 ? length : false;
  if (length) {
    const possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';

    for (let index = 1; index < length ; index++) {
      let randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));

      str += randomChar;
    }

    return str;
  } else {
    return false;
  }
}