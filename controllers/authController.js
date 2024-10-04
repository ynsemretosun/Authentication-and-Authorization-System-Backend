const ldapService = require('../services/ldapService');
const blurMail = require('./../utils/blurMail');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const otpService = require('../services/otpService');
const { promisify } = require('util');
const signToken = (user) => {
  const { id, role } = user; // Kullanıcı bilgilerinin alınması

  // Token'ın oluşturulması
  return jwt.sign(
    {
      id,
      role,
    },
    process.env.JWT_SECRET, // Token'ın şifrelenmesi için kullanılacak anahtar
    {
      expiresIn: process.env.JWT_EXPIRES_IN, // Token'ın geçerlilik süresi
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
  //Token oluşturulması
  const userData = { ...user, role: user?.role || 'user' }; // Kullanıcı bilgilerinin alınması
  const token = signToken(userData); // Token'ın oluşturulması

  //Token' in ve kullanıcı bilgilerinin cevap olarak gönderilmesi
  res.status(statusCode).json({
    status: 'success',
    data: {
      user: userData,
      token,
    },
  });
};

exports.loginWithLdap = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return next(new AppError('Please provide username and password!', 404));
  }

  //Girilen kullanıcı bilgilerine göre giriş işleminin gerçekleştirilmesi
  const user = await ldapService.authenticate(username, password);
  if (!user) {
    return next(new AppError('Ldap authentication failed!', 401));
  }

  //otp kodunun oluşturulması ve veritabanına kaydedilmesi
  const otp = await otpService.generateAndSaveOTP(user.email);

  //otp kodunun kullanıcıya mail olarak gönderilmesi
  // await otpService.sendOTP(user.mail, otp);

  //loglama için gerekli verilerin çerezlere ve istek nesnesine kaydedilmesi
  req.session.user = user;
  req.service = 'LDAP Authentication Service';

  //Cevabın gönderilmesi
  res.status(200).json({
    status: 'success',
    message: 'OTP sent successfully!',
    data: {
      //Ön yüzde göstermek için gizlenmiş kullanıcı mailinin ön yüze gönderilmesi
      bluredMail: blurMail(user.email),
    },
  });
});

exports.verifyOtp = catchAsync(async (req, res, next) => {
  // Servis adının belirlenmesi
  req.service = 'Otp Verification Service';
  const { otp } = req.body;

  //Girilen otp kodunun olup olmadığının kontrolü
  if (!otp) {
    return next(
      new AppError('Please provide an OTP code for authentication!', 404)
    );
  }

  //Kullanıcı bilgilerinin kontrolü
  if (!req.session.user) {
    return next(new AppError('User not found!', 404));
  }
  //otp kodunun doğrulanması
  await otpService.verifyOTP(req.session.user.email, otp, next);

  //jwt token oluşturulması ve kullanıcıya gönderilmesi
  createSendToken(req.session.user, 200, res);
});

exports.resendOtp = catchAsync(async (req, res, next) => {
  req.service = 'OTP Resend Service';

  const user = req.session.user; // Kullanıcı bilgilerinin alınması
  const otp = await otpService.generateAndSaveOTP(user.email); // Yeni bir OTP oluşturulması

  if (!otp) {
    return next(new AppError('OTP resend failed!', 404));
  }

  await otpService.sendOTP(user.email, otp); // Yeni oluşturulan OTP'nin kullanıcıya mail olarak gönderilmesi
  res.status(200).json({ message: 'New OTP sent successfully!' }); // Cevabın gönderilmesi
});

exports.restrictedTo = (...roles) => {
  // İzin verilen rollerin belirlenmesi
  return (req, res, next) => {
    const userRole = req?.role?.toLowerCase() || 'user'; // Kullanıcının rolünün alınması
    roles = [...roles].map((role) => role.toLowerCase()); // İzin verilen rollerin küçük harfe çevrilmesi

    // Eğer kullanıcının rolü izin verilen roller arasında değilse hata döndür
    if (!roles.includes(userRole)) {
      return next(
        new AppError('You do not have permission to perform this action!', 403)
      );
    }
    next(); // Eğer kullanıcının rolü izin verilen roller arasında ise sonraki middleware'e geç
  };
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // İstek başlığından varsa token'ın alınması
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401) // Eğer token yoksa hata döndür
    );
  }
  // Token'ın doğrulanması
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  req.role = decoded.role;
  req.service = 'JWT Verification Service';
  next(); // Eğer token doğrulanırsa sonraki middleware'e geç
});

exports.getUser = catchAsync(async (req, res) => {
  req.service = 'Passport Profile Service';
  if (req.user) {
    createSendToken(req.user, 200, res);
  } else {
    return new AppError('User not found!', 404);
  }
});

exports.googleCallback = (req, res, next) => {
  // Google'dan dönen kullanıcı bilgilerini almak için passport.authenticate fonksiyonunun kullanılması
  passport.authenticate('google', (err, user, info) => {
    if (err) {
      return next(
        new AppError('Something went wrong while logging with Google!', 401)
      );
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa giriş sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(
          new AppError(
            'Something went wrong while saving user info to request!',
            401
          )
        );
      }

      // Kullanıcının oturum bilgilerini session'a eklenmesi
      req.session.user = user;
      req.service = 'Passport Google Service';
      // Başarılı giriş sonrası ön yüzdeki profil sayfasına yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

exports.githubCallback = (req, res, next) => {
  // Github'dan dönen kullanıcı bilgilerini almak için passport.authenticate fonksiyonunun kullanılması
  passport.authenticate('github', (err, user, info) => {
    if (err) {
      return next(
        new AppError('Something went wrong while logging with GitHub!', 401)
      );
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa giriş sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(
          new AppError(
            'Something went wrong while saving user info to request!',
            401
          )
        );
      }

      // Kullanıcının oturum bilgilerini session'a eklenmesi
      req.session.user = user;
      req.service = 'Passport Github Service';
      // Başarılı giriş sonrası ön yüzdeki profil sayfasına yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

exports.facebookCallback = (req, res, next) => {
  // Facebook'tan dönen kullanıcı bilgilerini almak için passport.authenticate fonksiyonunun kullanılması
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      new AppError('Something went wrong while logging with Facebook!', 401);
    }
    if (!user) {
      return res.redirect('https://localhost:5173/login'); // Kullanıcı bulunamazsa ön yüzdeki giriş sayfasına yönlendir
    }

    // Başarılı giriş durumunda kullanıcıyı oturuma kaydet
    req.logIn(user, (err) => {
      if (err) {
        return next(
          new AppError(
            'Something went wrong while saving user info to request!',
            401
          )
        ); // Kullanıcı bilgileri kaydedilirken hata oluşursa hata döndür
      }

      // Kullanıcının oturum bilgilerini session'a eklenmesi
      req.session.user = user;
      req.service = 'Passport Facebook Service';
      // Başarılı giriş sonrası ön yüzdeki profil sayfasına yönlendirme
      return res.redirect(`https://localhost:5173/profile/${user.id}`);
    });
  })(req, res, next);
};

exports.logout = async (req, res, next) => {
  req.service = 'Logout Service';
  // Kullanıcının oturumunun sonlandırılması
  req.logout((err) => {
    if (err) {
      return next(new AppError('Failed to logout.', 500));
    }
    // Kullanıcının oturumunun sonlandırılması durumunda başarılı cevabın gönderilmesi
    res
      .status(200)
      .json({ status: 'success', message: 'Logged out successfully!' });
  });
};
