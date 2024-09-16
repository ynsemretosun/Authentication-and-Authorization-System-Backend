module.exports = parseEntry = (entry) => {
  const parsedEntry = {};

  entry.forEach((attr) => {
    parsedEntry[attr.type] = attr.values;
  });

  return parsedEntry;
};
