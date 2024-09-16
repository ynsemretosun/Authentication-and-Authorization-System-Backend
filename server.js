const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ldap = require('ldapjs');
const https = require('https');
const fs = require('fs');
dotenv.config({ path: './config.env' });
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💣 Shutting down...');
  console.log(err.name, ',', err.message);
  process.exit(1);
});
const app = require('./app');
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB).then(() => console.log('DB connection succesfull!'));

const port = process.env.PORT || 8000;
const options = {
  key: fs.readFileSync('./Certification/cert.key'),
  cert: fs.readFileSync('./Certification/cert.crt'),
};
const server = https.createServer(options, app);
server.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// const client = new net.Socket();
// client.connect(389, '192.168.1.240', () => {
//   console.log('Bağlantı başarılı!');
//   client.destroy(); // Bağlantıyı kapat
// });

// client.on('error', (err) => {
//   console.error('Bağlantı hatası:', err.message);
// });
// LDAP sunucu bilgileri
// const client = ldap.createClient({
//   url: 'ldap://192.168.1.240:389', // Sunucu adresini ve portu buraya girin
// });

// Kullanıcı giriş bilgileri
// const username = 'admin@yunus.local'; // UPN formatında username
// const password = '3Fzat05un1'; // Kullanıcı şifresi

// Bağlantıyı başlat ve kimlik doğrulaması yap
// client.bind(username, password, (err) => {
//   if (err) {
//     console.error('Giriş başarısız:', err.message);
//   } else {
//     console.log('Giriş başarılı!');

//     const searchBase = 'dc=yunus,dc=local'; // Kendi domain yapınıza göre değiştirin
//     const searchOptions = {
//       filter: '(objectClass=*)', // Kullanıcı nesnelerini bulmak için filtre
//       scope: 'sub', // Alt dallarda arama yapar
//       attributes: ['cn'], // Döndürülmesini istediğiniz bilgiler
//     };

//     // Arama işlemi başlat
//     client.search(searchBase, searchOptions, (err, res) => {
//       if (err) {
//         console.error('Arama hatası:', err.message);
//       } else {
//         let foundEntries = false;

//         res.on('searchEntry', (entry) => {
//           if (entry.object) {
//             foundEntries = true;
//             console.log('Kullanıcı bilgileri:');
//             console.log(JSON.stringify(entry.object, null, 2)); // JSON formatında düzgün bir şekilde yazdırma
//           } else {
//             console.log('Kullanıcı yok!.');
//           }
//         });

//         res.on('searchReference', (referral) => {
//           console.log('Arama referansı:', referral.uris);
//         });

//         res.on('error', (err) => {
//           console.error('Arama sırasında hata:', err.message);
//         });

//         res.on('end', (result) => {
//           console.log('Arama işlemi bitti, durumu:', result.status);
//           if (!foundEntries) {
//             console.log('Kullanıcı bulunamadı.');
//           }
//           client.unbind(); // Bağlantıyı sonlandır
//         });
//       }
//     });
//   }
// });

// LDAP sunucusuna bağlanmak için gerekli konfigürasyon

// LDAP sunucusuna bağlanın ve giriş yapın
// async function connectAndSearch() {
//   try {
//     // Bağlantıyı başlat
//     // await ldap.bind(ldapConfig.bindDN, ldapConfig.bindCredentials);
//     // console.log('Giriş başarılı!');

//     // Arama işlemi için konfigürasyonu ayarlayın
//     // const searchBase = 'dc=yunus,dc=local'; // Kendi domain yapınıza göre değiştirin
//     // const searchOptions = {
//     //   filter: '(objectClass=user)', // Kullanıcı nesnelerini bulmak için filtre
//     //   scope: 'sub', // Alt dallarda arama yapar
//     //   attributes: ['cn', 'mail', 'givenName', 'sn', 'displayName'], // Döndürülmesini istediğiniz bilgiler
//     // };

//     // // Kullanıcıları arayın
//     // const searchResults = await ldap.search(searchBase, searchOptions);

//     const person = await ldap.get('cn=Doee,cn=Users,dc=yunus,dc=local');
//     console.log(person.toJSON());
//   } catch (err) {
//     console.error('Bağlantı veya arama sırasında hata:', err.message);
//   }
// }

// // Fonksiyonu çağırarak işlemi başlatın
// connectAndSearch();

// LDAP bağlantı bilgileri

// Şifreyi UTF-16 LE formatına dönüştüren fonksiyon
// function encodePassword(password) {
//   const passwordWithQuotes = `"${password}"`; // Çift tırnak eklenmeli
//   const buffer = Buffer.from(passwordWithQuotes, 'utf16le'); // UTF-16 LE formatında
//   return buffer;
// }
// function decodePassword(buffer) {
//   // Buffer'dan UTF-16 LE formatında stringe dönüştür
//   const passwordWithQuotes = buffer.toString('utf16le');
//   // Çift tırnakları kaldır
//   const password = passwordWithQuotes.replace(/^"(.*)"$/, '$1');
//   return password;
// }
// // Kullanıcı ekleme işlemi
// async function addUser() {
//   try {
//     // Yeni kullanıcı bilgileri
//     const newUser = {
//       cn: 'YunusEmreeee',
//       sn: 'Doe',
//       sAMAccountName: 'YunusEmreeee',
//       userPrincipalName: 'Yunus123Emreeee@yunus.local',
//       objectClass: ['user'],
//       userPassword: crypto
//         .createHash('sha256')
//         .update('3Fzat05un1')
//         .digest('base64'),
//     };
//     await ldap.add('cn=YunusEmreeee,cn=Users,dc=yunus,dc=local', newUser);

//     console.log('Kullanıcı başarıyla eklendi!');
//   } catch (error) {
//     console.error('Kullanıcı eklenirken hata oluştu:', error);
//   }
// }

// addUser();

// let addUser = async () => {
//   const client = ldap.createClient({
//     url: 'ldap://192.168.1.240:389',
//   });
//   client.bind('admin@yunus.local', '3Fzat05un1', (err) => {
//     if (err) {
//       console.error('Giriş başarısız:', err.message);
//     } else {
//       console.log('Giriş başarılı!');
//       const newUser = {
//         givenName: 'none',
//         uid: '12345id',
//         cn: 'Testnus',
//         sn: 'Doe',
//         userPassword: '3Fzat05un1',
//         objectClass: ['person', 'organizationalPerson', 'inetOrgPerson'],
//       };
//       client.add('cn=Testnus,cn=Users,dc=yunus,dc=local', newUser, (err) => {
//         if (err) {
//           console.error('Kullanıcı eklenirken hata oluştu:', err.message);
//         } else {
//           console.log('Kullanıcı başarıyla eklendi!');
//         }
//       });
//     }
//   });
// };
// addUser();
// const changePassword = async () => {
//   const client = ldap.createClient({
//     url: 'ldap://192.168.1.240:389',
//   });
//   client.bind('admin@yunus.local', '3Fzat05un1', (err) => {
//     if (err) {
//       console.error('Giriş başarısız:', err.message);
//     } else {
//       console.log('Giriş başarılı!');
//       const password = '3Fzat05un1';
//       const newPassword = '12345';
//       const change = {
//         operation: 'replace',
//         modification: {
//           cn: 'Ahmet',
//         },
//       };
//       client.modify('cn=Testnus,cn=Users,dc=yunus,dc=local', change, (err) => {
//         if (err) {
//           console.error('Şifre değiştirme sırasında hata:', err.message);
//         } else {
//           console.log('Şifre başarıyla değiştirildi!');
//         }
//       });
//     }
//   });
// };
// changePassword();

// const ldapConfig = {
//   url: 'ldap://192.168.1.240:389', // Ldap sunucusunun IP adresini ve portunu girin
//   bindDN: 'admin@yunus.local', // Ldap sunucusuna giriş yapmak için kullanılan kullanıcı adı
//   bindCredentials: '3Fzat05un1', // Ldap sunucusuna giriş yapmak için kullanılan şifre
// };

// const ldap = new Ldap({
//   url: ldapConfig.url,
//   bindDN: ldapConfig.bindDN,
//   bindCredentials: ldapConfig.bindCredentials,
// });
// console.log(ldap.get('cn=Administrator,cn=Users,dc=yunus,dc=local'));
// const changePassword = async () => {
//   try {
//     await ldap.setAttribute(
//       'cn=Administrator,cn=Users,dc=yunus,dc=local',
//       'userPassword',
//       '3Fzat05un'
//     );
//     console.log('iki');
//   } catch (e) {
//     console.log(e);
//   }
// };
// changePassword();
encodePassword = (password) => {
  const passwordWithQuotes = `"${password}"`;
  const buffer = Buffer.from(passwordWithQuotes, 'utf16le');
  return buffer;
};
decodePassword = (buffer) => {
  const passwordWithQuotes = buffer.toString('utf16le');
  const password = passwordWithQuotes.replace(/^"(.*)"$/, '$1');
  return password;
};

const login = async () => {
  const client = ldap.createClient({
    url: 'ldaps://192.168.1.240:636',
    tlsOptions: {
      rejectUnauthorized: false, // Sertifika doğrulamasını devre dışı bırakmak için
    },
  });
  await client.bind('TestUser123@yunus.local', '3Fzat05un1', (err) => {
    if (err) {
      console.error('Giriş başarısız:', err.message);
    } else {
      console.log('Giriş başarılı!');
    }
  });

  // const entry = {
  //   cn: 'TestUser',
  //   sn: 'User',
  //   sAMAccountName: 'TestUser',
  //   objectClass: ['organizationalPerson', 'person', 'top', 'user'],
  //   unicodePwd: encodePassword('3Fzat05un1'),
  // };
  // client.add(
  //   'cn=TestUser,cn=Users,dc=yunus,dc=local',
  //   entry,
  //   function (err, result) {
  //     console.log(err, result);
  //   }
  // );
  client.add(
    'cn=TestUser123,cn=Users,dc=yunus,dc=local',
    {
      cn: 'TestUser123',
      sn: 'User',
      sAMAccountName: 'TestUser123',
      objectClass: ['organizationalPerson', 'person', 'top', 'user'],
      unicodePwd: encodePassword('3Fzat05un1'),
      userAccountControl: '512',
    },
    function (err) {
      console.log(err);
    }
  );
};
// login();

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💣 Shutting down...');
  console.log(err.name, ',', err.message);
  server.close(() => {
    process.exit(1);
  });
});
