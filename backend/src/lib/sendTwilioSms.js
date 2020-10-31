const https = require('https');
const config = require('../config');
const querystring = require('querystring');

module.exports = function sendTwilioSms(phoneNumber, message, callback) {

  const { from, accountSid, authToken } = config.twilio;

  phoneNumber = typeof(phoneNumber) == "string" && phoneNumber.length > 0 ? phoneNumber : false;
  message = typeof(message) == "string" && message.trim().length > 0 && message.trim().length <= 1600 ? message : false;

  if (phoneNumber && message) {
    const payload = {
      From: from,
      To: phoneNumber,
      Body: message,
    };

    const stringPayload = querystring.stringify(payload);

    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      auth: `${accountSid}:${authToken}`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    const request = https.request(requestDetails, (res) => {
      const status = res.statusCode;
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback(`Status code returned was: ${status} error was ${res.statusMessage}`);
      }
    });

    request.on('error', (err) => {
      callback(err);
    });

    request.write(stringPayload);
    request.end();

  } else {
    callback('Given parameters were missing or invalid');
  }
}