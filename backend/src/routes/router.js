const handlers = require('./handlers');

module.exports = {
  'ping': handlers.ping,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks,
  'notFound': handlers.notFound
}