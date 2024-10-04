const morgan = require('morgan');
const logger = require('./logger');

// Custom tokenlerin oluşturulması
morgan.token('service', (req) => {
  return req?.service || 'Unknown Service';
});
morgan.token('user', (req) => {
  return req?.session?.user ? req?.session?.user.displayName : 'Unknown User';
});
morgan.token('userType', (req) => {
  return req?.session?.user
    ? req?.session?.user?.userType
    : 'Unknown User Type';
});

// JSON formatında loglama
const jsonFormat = (tokens, req, res) => {
  return JSON.stringify({
    ip: tokens['remote-addr'](req, res),
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: tokens.status(req, res),
    contentLength: tokens.res(req, res, 'content-length'),
    responseTime: tokens['response-time'](req, res) + ' ms',
    service: tokens.service(req),
    user: tokens.user(req),
    userType: tokens.userType(req),
  });
};

// Yakalanan logların Winston'a iletilmesi
const stream = {
  write: (message) => {
    logger.info(message.trim()); // Morgan mesajını Winston'a iletme
  },
};

// Morgan'ı Winston ile kullanarak middleware oluşturulması
const morganMiddleware = morgan(jsonFormat, { stream });

module.exports = morganMiddleware;
