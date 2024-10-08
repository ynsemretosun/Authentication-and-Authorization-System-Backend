const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Taşıyıcının oluşturulması
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // Mail seçeneklerinin oluşturulması
  const mailOptions = {
    from: 'Yunus Emre TOSUN',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  
  // Mailin gönderilmesi
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
