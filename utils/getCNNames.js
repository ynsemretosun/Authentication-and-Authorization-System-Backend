// LDAP'tan dönen grup bilgilerinden sadece grup isimlerinin alınması
const getCNNames = (groups) => {
  return groups.map((group) => {
    const cnPart = group.split(',')[0]; //
    return cnPart.split('=')[1]; //
  });
};

module.exports = getCNNames;
