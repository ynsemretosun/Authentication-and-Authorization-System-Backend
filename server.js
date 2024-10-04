const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ldap = require('ldapjs');
const https = require('https');
const fs = require('fs');
dotenv.config({ path: './config.env' }); // Config dosyasının yüklenmesi
const app = require('./app');
// Dönen hataların yakalanması ve işlenmesi
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💣 Shutting down...');
  console.log(err.name, ',', err.message);
  process.exit(1);
});
// Veritabanı bağlantısının oluşturulması
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log('DB connection succesfull!'));

// Sunucunun başlatılması
const port = process.env.PORT || 8000;
const options = {
  key: fs.readFileSync('./Certification/cert.key'),
  cert: fs.readFileSync('./Certification/cert.crt'),
};
const server = https.createServer(options, app);
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Dönen hataların yakalanması ve işlenmesi
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💣 Shutting down...');
  console.log(err.name, ',', err.message);
  server.close(() => {
    process.exit(1);
  });
});
