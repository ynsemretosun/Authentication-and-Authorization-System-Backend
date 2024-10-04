// LDAP' tan alınan GUID değeri binary formatında olduğu için
//bu değeri okunabilir bir formata çevirmek için aşağıdaki fonksiyon kullanıldı.
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

module.exports = resolveGUID;
