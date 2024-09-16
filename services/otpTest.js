const crypto = require('crypto');

exports.generateOTP = function () {
  while (true) {
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    console.log(`Generated OTP: ${otp}`);

    // Kontrol etmek için
    if (otp.length !== 6) {
      throw new Error(`OTP is not 6 digits long: ${otp}`);
    }
  }
};
