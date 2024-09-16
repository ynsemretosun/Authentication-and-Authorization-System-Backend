const crypto = require('crypto');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const OTP = require('../models/otpModel');
const catchAsync = require('../utils/catchAsync');

exports.generateAndSaveOTP = async (email) => {
  if (!email) {
    return new AppError('Please provide an email.', 400);
  }
  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  console.log(`Generated OTP: ${otp}`);

  // Kontrol etmek için
  if (otp.length !== 6) {
    throw new AppError(`OTP is not 6 digits long: ${otp}`);
  }
  const otpDoc = await OTP.findOne({ email });

  if (!otpDoc) {
    await OTP.create({ email, otp });
  } else {
    await OTP.findOneAndUpdate({ email }, { otp });
    console.log('otp updated');
  }
  return otp;
};

exports.sendOTP = async (email, otp) => {
  if (!email || !otp) {
    throw new AppError('Please provide an email and an OTP.', 400);
  }
  const message = `Your OTP code is: ${otp}`;
  await sendEmail({ email, subject: 'OTP Code', message });
};

exports.verifyOTP = async (email, otp, next) => {
  const otpDoc = await OTP.findOne({ email, otp });
  if (!otpDoc) {
    throw new AppError('Your OTP code is invalid or has expired.', 400);
  }
  await OTP.deleteOne({
    email,
    otp,
  });
};
