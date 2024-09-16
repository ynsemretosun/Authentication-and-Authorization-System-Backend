// const morgan = require('morgan');

// morgan.token('service', (req) => {
//   return req.service || 'Unknown Service';
// });
// morgan.token('user', (req) => {
//   return req.session.user ? req.session.user.displayName : 'Unknown User';
// });
// morgan.token('userType', (req) => {
//   return req.session.user ? req.session.user.userType : 'Unknown User Type';
// });

// const jsonFormat = (tokens, req, res) => {
//   return JSON.stringify({
//     ip: tokens['remote-addr'](req, res),
//     method: tokens.method(req, res),
//     url: tokens.url(req, res),
//     status: tokens.status(req, res),
//     contentLength: tokens.res(req, res, 'content-length'),
//     responseTime: tokens['response-time'](req, res) + ' ms',
//     service: tokens.service(req),
//     user: tokens.user(req),
//     userType: tokens.userType(req),
//   });
// };

// middleware/morganLogger.js
const winston = require('winston');
const { Writable } = require('stream');
const Logger = require('../models/loggerModel');

// Winston formatını tanımlama
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Winston logger'ı oluşturma
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  transports: [
    new winston.transports.Stream({
      stream: new Writable({
        objectMode: true,
        write: async (log, encoding, callback) => {
          try {
            const logData = JSON.parse(log.message);
            await Logger.create({
              method: logData.method,
              url: logData.url,
              status: parseInt(logData.status, 10),
              responseTime: logData.responseTime,
              user: logData.user,
              ip: logData.ip,
              service: logData.service,
              userType: logData.userType,
            });
          } catch (error) {
            console.error('Failed to save log to MongoDB', error);
          }
          callback();
        },
      }),
    }),
  ],
});

module.exports = logger;
