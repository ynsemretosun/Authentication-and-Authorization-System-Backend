module.exports = (email) => {
  // E-postayı "username" ve "domain" olarak ayrılması
  const [username, domain] = email.split('@');
  const usernameLength = username.length;

  // Eğer kullanıcı adı uzunluğu 4'ten küçükse, sadece ilk karakteri gösterilmesi
  //geri kalanının gizlenmesi
  if (usernameLength < 4) {
    const start = username.slice(0, 1);
    const blurredRest = '*'.repeat(usernameLength - 1);
    return `${start}${blurredRest}@${domain}`;
  }

  //Kullanıcı adı kısmı 4 karakterden fazla ise karakter sayısını dörde bölüp baştan ve
  //sondan o kadar karakterin gösterilmesi, diğerlerinin gizlenmesi
  const numVisibleChars = Math.floor(usernameLength / 4);
  const start = username.slice(0, numVisibleChars);
  const end = username.slice(-numVisibleChars);
  const blurredMiddle = '*'.repeat(usernameLength - numVisibleChars * 2);
  const blurredUsername = `${start}${blurredMiddle}${end}`;
  return `${blurredUsername}@${domain}`;
};
