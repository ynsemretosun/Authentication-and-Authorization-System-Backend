const mongoose = require('mongoose');
const validator = require('validator');
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
    lowercase: true,
  },
  otp: {
    type: Number,
    required: [true, 'OTP is required!'],
    length: [6, 'OTP must be 6 digits!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 300,
  },
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
