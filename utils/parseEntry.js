// LDAP'tan dönen bilgilerin parçalanması
module.exports = (entry) => {
  const parsedEntry = {};

  entry.forEach((attr) => {
    parsedEntry[attr.type] = attr.values;
  });

  return parsedEntry;
};
