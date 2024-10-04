const winston = require('winston');
const { Writable } = require('stream');
const Logger = require('../models/loggerModel');
// Winston formatının tanımlanması
const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Winston logger'ı oluşturma
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), logFormat),
  // Logların MongoDB'ye kaydedilmesi
  transports: [
    new winston.transports.Stream({
      stream: new Writable({
        objectMode: true,
        write: async (log, encoding, callback) => {
          try {
            const logData = JSON.parse(log.message);
            // MongoDB'ye logların kaydedilmesi
            await Logger.create({
              method: logData.method,
              url: logData.url,
              status: parseInt(logData.status, 10),
              responseTime: logData.responseTime,
              contentLength: parseInt(logData.contentLength, 10),
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
