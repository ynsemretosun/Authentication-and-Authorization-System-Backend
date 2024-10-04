const crypto = require('crypto');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const OTP = require('../models/otpModel');
const catchAsync = require('../utils/catchAsync');

exports.generateAndSaveOTP = async (email) => {
  // Eğer parametre olarak email gelmezse hata döndür
  if (!email) {
    throw new AppError('Please provide an email.', 400);
  }

  // 6 haneli bir OTP oluştur
  const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');

  // Eğer oluşturulan OTP 6 haneli değilse hata döndür
  if (otp.length !== 6) {
    throw new AppError(`OTP is not 6 digits long: ${otp}`);
  }

  // Email adresi ile kayıtlı bir OTP var mı kontrol et. Eğer yoksa oluştur, varsa güncelle;
  // bu sayede bu fonksiyon hem ilk defa otp oluşturmak için hem de yeniden oluşturmak için kullanılabilir.
  const otpDoc = await OTP.findOne({ email });

  // Eğer email adresi ile kayıtlı bir OTP yoksa yeni bir OTP oluştur ve kaydet
  if (!otpDoc) {
    await OTP.create({ email, otp });
  } else {
    // Eğer email adresi ile kayıtlı bir OTP varsa, bu OTP'yi güncelle
    await OTP.findOneAndUpdate({ email }, { otp });
  }
  return otp;
};

exports.sendOTP = async (email, otp) => {
  // Eğer parametre olarak email ve otp gelmezse hata döndür
  if (!email || !otp) {
    throw new AppError('Please provide an email and an OTP.', 400);
  }
  // Mesajın oluşturulması ve gönderilmesi
  const message = `Your OTP code is: ${otp}\nThis code is only valid for 5 minutes!`;
  await sendEmail({ email, subject: 'OTP Code', message });
};

exports.verifyOTP = async (email, otp, next) => {
  // Parametre olarak girilen email ve otp ile kayıtlı bir OTP var mı kontrol et
  const otpDoc = await OTP.findOne({ email, otp });
  if (!otpDoc) {
    throw new AppError('Your OTP code is invalid or has expired.', 400);
  }
  // Doğrulama işlemi başarılıysa, kayıtlı olan OTP'yi sil
  await OTP.deleteOne({
    email,
    otp,
  });
};
