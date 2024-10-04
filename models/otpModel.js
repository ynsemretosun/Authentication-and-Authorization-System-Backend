const mongoose = require('mongoose');
const validator = require('validator');
// OTP için şema oluşturulması
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email!'],
    unique: true, // Email adresinin benzersiz olmasının kontrolü
    validate: [validator.isEmail, 'Please provide a valid email!'], // Email formatı kontrolü
    lowercase: true,
  },
  otp: {
    type: Number,
    required: [true, 'OTP is required!'],
    length: [6, 'OTP must be 6 digits!'], // OTP'nin 6 haneli olmasının kontrolü
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 300, // 5 dakika sonra silinecek
  },
});

const OTP = mongoose.model('OTP', otpSchema);
module.exports = OTP;
