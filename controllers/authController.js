const ldapService = require('../services/ldapService');
// const oauthService = require('../services/oauthService');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const otpService = require('../services/otpService');
const { promisify } = require('util');
// app.use(cookieParser());
// app.router.use(cookieParser());
// app.use(cookieParser());
const signToken = (user) => {
  const id = user.id;
  const role = user.role;
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
};
const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  httpOnly: true,
};
if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

const createSendToken = (user, statusCode, res) => {
  const userData = { ...user, role: user.role || 'user' };
  console.log(userData);
  console.log(blurEmail(userData.email));
  const token = signToken(userData);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: userData,
    },
  });
};

exports.loginWithLdap = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Please provide username and password!', 404));
  }
  const user = await ldapService.authenticate(username, password);
  console.log(user);
  if (!user) {
    return next(new AppError('Ldap authentication failed!', 401));
  }
  console.log(user.mail);
  const otp = await otpService.generateAndSaveOTP(user.email);
  console.log(otp);

  // await otpService.sendOTP(user.mail, otp);
  console.log(otp);
  req.session.user = user;
  req.service = 'LDAP Authentication Service';
  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully!',
    data: {
      bluredMail: blurEmail(user.email),
    },
  });
});

// exports.sendOTP = catchAsync(async (req, res, next) => {
//   const user = req.session.user;
//   console.log(user);
//   const otp = await otpService.generateAndSaveOTP(user.mail);

//   await otpService.sendOTP(email, otp);
//   res.status(200).json({ message: 'OTP sent successfully!' });
// });

function blurEmail(email) {
  // E-postayı "username" ve "domain" olarak ayırıyoruz.
  const [username, domain] = email.split('@');

  // Kullanıcı adının uzunluğu
  const usernameLength = username.length;

  // Kullanıcı adının 3'te 1'ini göstereceğiz (en az 1 karakter)
  const numVisibleChars = Math.max(1, Math.floor(usernameLength / 3));

  // Kullanıcı adında rastgele yerlerden numVisibleChars kadar karakter seçelim
  let visibleIndices = new Set();
  while (visibleIndices.size < numVisibleChars) {
    const randomIndex = Math.floor(Math.random() * usernameLength);
    visibleIndices.add(randomIndex); // Rastgele indexleri set içine ekliyoruz (unique olmasını sağlamak için)
  }

  // Kullanıcı adının gizlenmiş halini oluşturalım
  let blurredUsername = '';
  for (let i = 0; i < usernameLength; i++) {
    if (visibleIndices.has(i)) {
      blurredUsername += username[i];
    } else {
      blurredUsername += '*';
    }
  }

  return `${blurredUsername}@${domain}`;
}

exports.verifyOtp = catchAsync(async (req, res, next) => {
  req.service = 'Otp Verification Service';
  const { otp } = req.body;
  if (!otp) {
    return next(
      new AppError('Please provide an OTP code for authentication!', 404)
    );
  }
  if (!req.session.user) {
    return next(new AppError('User not found!', 404));
  }

  await otpService.verifyOTP(req.session.user.email, otp, next);

  createSendToken(req.session.user, 200, res);
});

exports.resendOtp = catchAsync(async (req, res, next) => {
  const user = req.session.user;
  console.log(req.session.user);
  const otp = await otpService.generateAndSaveOTP(user.email);
  console.log(otp);
  if (!otp) {
    return next(new AppError('OTP resend failed!', 404));
  }
  await otpService.sendOTP(user.email, otp);
  // req.service = 'OTP Resend Service';
  res.status(200).json({ message: 'New OTP sent successfully!' });
});

exports.loginWithOAuth = catchAsync(async (req, res, next) => {
  const user = await oauthService.authenticate(provider);
  if (!user) {
    return next(new AppError('Outh authentication failed!', 401));
  }
  console.log('user', user);
  res.status(200).json({ message: 'OAuth Authentication successful', user });
});

exports.loginWithGoogle = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.restrictedTo = (...roles) => {
  return (req, res, next) => {
    const userRole = req.role.toLowerCase() || 'user';
    roles = [...roles].map((role) => role.toLowerCase());
    if (!roles.includes(userRole)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }
    next();
  };
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }
  //Validate token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  req.role = decoded.role;
  req.service = 'JWT Verification Service';
  //Check user still exist
  // const currentUser = await searchUser(client, decoded.id);
  // if (!currentUser)
  //   return next(
  //     new AppError('The user belonging to this token does no loger exist!', 401)
  //   );
  // //Check user changed password after token was issued
  // req.user = currentUser;
  next();
});

exports.getUser = catchAsync(async (req, res) => {
  req.service = 'Passport Profile Service';
  if (req.user) {
    createSendToken(req.user, 200, res);
  } else {
    throw new AppError('User not found!', 404);
  }
});

exports.googleFailure = (req, res) => {
  res.status(401).json({
    status: 'fail',
    message: 'failed to log in',
  });
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return next(err); // Hata varsa, hata middleware'ine yönlendir
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa başarısız sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Hata varsa, hata middleware'ine yönlendir
      }

      // Kullanıcıyı session'a ekleyin
      req.session.user = user;
      req.service = 'Passport Google Service';
      // Başarılı giriş sonrası yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

exports.githubCallback = (req, res, next) => {
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      return next(err); // Hata varsa, hata middleware'ine yönlendir
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa başarısız sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Hata varsa, hata middleware'ine yönlendir
      }

      // Kullanıcıyı session'a ekleyin
      req.session.user = user;
      req.service = 'Passport Github Service';
      // Başarılı giriş sonrası yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

exports.facebookCallback = (req, res, next) => {
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      return next(err); // Hata varsa, hata middleware'ine yönlendir
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa başarısız sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Hata varsa, hata middleware'ine yönlendir
      }

      // Kullanıcıyı session'a ekleyin
      req.session.user = user;
      req.service = 'Passport Facebook Service';
      // Başarılı giriş sonrası yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

// exports.logout = (req, res, next) => {
//   req.logout((err) => {
//     if (err) {
//       return next(err);
//     }
//     res.redirect('/homepage');
//   });
// }
exports.authMiddleware = (req, res, next) => {
  console.log(req.user);
  // console.log(token);
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.logout = async (req, res, next) => {
  req.service = 'Logout Service';
  req.logout((err) => {
    if (err) {
      return next(new AppError('Failed to logout.', 500));
    }
    res
      .status(200)
      .json({ status: 'success', message: 'Logged out successfully!' });
  });
};
