const ldap = require('ldapjs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const parseEntry = require('../utils/parseEntry');
const resolveGUID = require('../utils/resolveGUID');
const getCNNames = require('../utils/getCNNames');

const authenticate = (username, password) => {
  return new Promise((resolve, reject) => {
    // ldap için client oluşturulması
    const client = ldap.createClient({
      url: 'ldaps://192.168.1.240:636',
      connectTimeout: 10000,
      timeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    });

    // ldap sunucusuna bağlanma işlemi
    const dn = `${username}@${process.env.LDAP_BASELOGONNAMESUFFIX}`;
    client.bind(dn, password, (err) => {
      if (err) {
        return reject(new AppError('LDAP authentication failed.', 401));
      }
    });

    // ldap sunucusundan kullanıcı bilgilerinin alınması
    searchUser(client, username)
      .then((user) => {
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const logout = catchAsync(async (req, res) => {
  const client = ldap.createClient({
    url: 'ldaps://192.168.1.240:636',
    connectTimeout: 10000,
    timeout: 10000,
    tlsOptions: { rejectUnauthorized: false },
  });
  client.unbind((err) => {
    if (err) {
      return new AppError('Failed to logout.', 500);
    }
    return { message: 'Logout successful.' };
  });
});

function bindClient(client, dn, password) {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) {
        return new AppError('LDAP authentication failed.', 401);
      }
      resolve({ message: 'LDAP authentication successful.' });
    });
  });
}

function parseGuid(guidString) {
  // Split the GUID string into its parts separated by hyphens
  const parts = guidString.split('-');

  // Validate the format (should have 5 parts)
  if (parts.length !== 5) {
    throw new Error(
      'Invalid GUID format. Must have 5 parts separated by hyphens.'
    );
  }

  // Create a new array to hold the binary representation of each part
  const binaryGUID = [];

  // Loop through each part and convert it to a byte array
  for (const part of parts) {
    // Validate each part length (should be 2 characters)
    if (part.length !== 2) {
      throw new Error(
        'Invalid GUID part format. Each part should have 2 characters.'
      );
    }

    // Combine the two characters and convert to a byte (base 16)
    binaryGUID.push(parseInt(part, 16));
  }

  return binaryGUID;
}

// function getUserBYGUID(client, guid) {
//   return new Promise((resolve, reject) => {
//     const searchOptions = {
//       scope: 'subtree',
//       filter: `(objectGUID=${guid})`,
//       attributes: ['cn', 'displayName', 'mail', 'memberOf', 'objectGUID'],
//     };
//     if (searchErr) {
//       return reject(new AppError('Failed to search user information.'));
//     }

//     let user = null;

//     res.on('searchEntry', (entry) => {
//       const parsedEntry = parseEntry(entry.attributes);
//       parsedEntry.objectGUID = resolveGUID(entry);
//       user = parsedEntry;
//     });

//     res.on('error', (err) => {
//       reject(new AppError('Search operation failed.'));
//     });

//     res.on('end', () => {
//       if (user) {
//         user: {

//         }
//         resolve(user);
//       } else {
//         reject(new AppError('User not found in LDAP.'));
//       }
//     });
//   });
// }

function searchUser(client, username) {
  return new Promise((resolve, reject) => {
    // Arama seçeneklerinin oluşturulması
    const searchOptions = {
      scope: 'subtree',
      filter: `(userPrincipalName=${username}@${process.env.LDAP_BASELOGONNAMESUFFIX})`,
      attributes: ['cn', 'displayName', 'mail', 'memberOf', 'objectGUID', 'sn'],
    };
    // Arama işleminin gerçekleştirilmesi
    client.search(process.env.LDAP_BASEDN, searchOptions, (searchErr, res) => {
      if (searchErr) {
        return reject(new AppError('Failed to search user information.'));
      }

      let user = null;

      res.on('searchEntry', (entry) => {
        // Arama sonucundan dönen kullanıcı bilgilerinin ayrıştırılması
        const parsedEntry = parseEntry(entry.attributes);
        parsedEntry.objectGUID = resolveGUID(entry); // binary GUID'i string GUID'e çevir

        // Kullanıcı bilgilerinin JSON formatına dönüştürülmesi
        user = {
          id: parsedEntry.objectGUID,
          displayName: parsedEntry.displayName[0],
          groups: getCNNames(parsedEntry.memberOf), // Grup isimlerinin okunabilecek hale getirilmesi
          email: parsedEntry.mail[0],
          userType: 'LDAP User',
          photo: 'Photo not provided',
          role: 'admin', // Erişim kısıtlı servisleri denemek için admin rolü verildi
        };
      });

      res.on('error', (err) => {
        reject(new AppError('Search operation failed.'));
      });

      // Arama işlemi sona erdiğinde kullanıcı bilgilerinin döndürülmesi
      res.on('end', () => {
        if (user) {
          resolve(user);
        } else {
          reject(new AppError('User not found in LDAP.'));
        }
      });
    });
  });
}

module.exports = { authenticate };
