const mongoose = require('mongoose');
const validator = require('validator');
// Loglama için şema oluşturulması
const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // 30 gün sonra silinecek
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH'], // Yalnızca belirtilen HTTP metodları kabul edilecek
    required: [true, 'Please provide the HTTP method!'],
  },
  url: {
    type: String,
    required: [true, 'Please provide the URL!'],
  },
  status: {
    type: Number,
    required: [true, 'Please provide the status code!'],
  },
  responseTime: {
    type: String,
    required: [true, 'Please provide the response time!'],
  },
  user: {
    type: String,
    required: [true, 'Please provide the user!'],
  },
  ip: {
    type: String,
    required: [true, 'Please provide the IP address!'],
    validate: [validator.isIP, 'Please provide a valid IP address!'], // IP adresi formatı kontrolü
  },
  contentLength: {
    type: Number,
    required: [true, 'Please provide the content length!'],
  },
  service: String,
  userType: String,
});

const Logger = mongoose.model('Logs', logSchema);

module.exports = Logger;
