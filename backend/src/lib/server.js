const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const { parse: parseQuery } = require('querystring');
const util = require('util');
const debug = util.debuglog('server');

const config = require('../config');
const router = require('../routes/router');
const httpsServerOptions = require('../config/httpsServerOptions');
const parseJsonToObject = require('./parseJsonToObject');

const server = {};

server.httpServer = http.createServer((req, res) => {
  server.unifiedServer(req, res);
});

server.httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  server.unifiedServer(req, res);
});

server.unifiedServer = (req, res) => {
  const parsedUrl = url.parse(req.url);

  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

  const { method, headers } = req;

  const query = parseQuery(parsedUrl.query);

  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });
  req.on('end', () => {
    buffer += decoder.end();

    const route = typeof(router[path]) !== 'undefined'
      ?  router[path]
      :  router['notFound'];

    const data = {
      path,
      method,
      headers,
      query,
      payload: parseJsonToObject(buffer)
    };

    route(data, (code, data) => {
      const statusCode = typeof(code) == 'number' ? code : 200;
      const payload = typeof(data) == 'object' ? data : {};

      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(JSON.stringify(payload));

      if ([200, 201, 204].indexOf(statusCode) > -1) {
        debug('\x1b[32m%s\x1b[0m', `${method.toUpperCase()} / ${path} - ${statusCode}`)
      } else {
        debug('\x1b[31m%s\x1b[0m', `${method.toUpperCase()} / ${path} - ${statusCode}`)
      }
    });
  });
};

server.init  = () => {
  server.httpServer.listen(config.httpPort, () => {
    console.log('\x1b[36m%s\x1b[0m',`Server listening on port ${config.httpPort} for HTTP connections on ${config.envName} environement `)
  });

  server.httpsServer.listen(config.httpsPort, () => {    
    console.log('\x1b[35m%s\x1b[0m',`Server listening on port ${config.httpsPort} for HTTPS connections on ${config.envName} environement `)
  });
};

module.exports = server;