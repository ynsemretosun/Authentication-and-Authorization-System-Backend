const ldap = require('ldapjs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const assert = require('assert');
const parsedEntry = require('../utils/parseEntry');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const authenticate = (username, password) => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: 'ldaps://192.168.1.240:636',
      connectTimeout: 10000,
      timeout: 10000,
      tlsOptions: { rejectUnauthorized: false },
    });

    const dn = `${username}@${process.env.LDAP_BASELOGONNAMESUFFIX}`;
    client.bind(dn, password, (err) => {
      if (err) {
        return reject(new AppError('LDAP authentication failed.', 401));
      }
    });
    searchUser(client, username)
      .then((user) => {
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });

  //   const user = client.search(username, {
  //     scope: 'base',
  //     attributes: ['uid', 'dn', 'cn', 'mail'],
  //   });
  //   console.log(user);
  //   return 'giriş başarılı';
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
function resolveGUID(entry) {
  if (!Array.isArray(entry.attributes))
    throw new Error('Attributes must be an array');

  const binaryGUID = entry.attributes.find(
    (attribute) => attribute.type === 'objectGUID'
  ).buffers[0];
  const guidFormat = [
    [3, 2, 1, 0],
    [5, 4],
    [7, 6],
    [8, 9],
    [10, 11, 12, 13, 14, 15],
  ];

  const guidArray = guidFormat.map((part) => {
    const stringPart = part.map((byte) => {
      // If less than 16 add a 0 to the end
      const byteString =
        binaryGUID[byte] < 16
          ? `0${binaryGUID[byte].toString(16)}`
          : binaryGUID[byte].toString(16);

      return byteString;
    });
    return `${stringPart.join('')}`;
  });
  return guidArray.join('-');
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
const getCNNames = (groups) => {
  return groups.map((group) => {
    const cnPart = group.split(',')[0]; // İlk CN parçasını al
    return cnPart.split('=')[1]; // "=" karakterinden sonrasını al
  });
};

function searchUser(client, username) {
  return new Promise((resolve, reject) => {
    const searchOptions = {
      scope: 'subtree',
      filter: `(userPrincipalName=${username}@${process.env.LDAP_BASELOGONNAMESUFFIX})`,
      attributes: ['cn', 'displayName', 'mail', 'memberOf', 'objectGUID', 'sn'],
    };

    client.search(process.env.LDAP_BASEDN, searchOptions, (searchErr, res) => {
      if (searchErr) {
        return reject(new AppError('Failed to search user information.'));
      }

      let user = null;

      res.on('searchEntry', (entry) => {
        const parsedEntry = parseEntry(entry.attributes);
        parsedEntry.objectGUID = resolveGUID(entry);

        user = {
          id: parsedEntry.objectGUID,
          displayName: parsedEntry.displayName[0],
          groups: getCNNames(parsedEntry.memberOf),
          email: parsedEntry.mail[0],
          userType: 'LDAP User',
          photo: 'Photo not provided',
          role: 'admin',
        };
      });

      res.on('error', (err) => {
        reject(new AppError('Search operation failed.'));
      });

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
