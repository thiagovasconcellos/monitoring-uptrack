const fs = require('fs');
const Path = require('path');

const keyPath = Path.resolve(__dirname, '..', 'https', 'key.pem');
const certPath = Path.resolve(__dirname, '..', 'https', 'server.crt');

console.log(keyPath);

module.exports = {
  key: fs.readFileSync(keyPath, 'utf8'),
  cert: fs.readFileSync(certPath, 'utf8')
}