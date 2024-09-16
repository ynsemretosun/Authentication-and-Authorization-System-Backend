const mongoose = require('mongoose');
const validator = require('validator');
const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30,
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH'],
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
    validate: [validator.isIP, 'Please provide a valid IP address!'],
  },
  service: String,
  userType: String,
});

const Logger = mongoose.model('Logs', logSchema);

module.exports = Logger;
