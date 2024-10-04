const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const userRouter = require('./routes/UserRoutes.js');
const passport = require('passport');
const passportSetupGoogle = require('./services/oauthService-google.js');
const passportSetupGithub = require('./services/oauthService-github.js');
const passportSetupFacebook = require('./services/oauthService-facebook.js');
const AppError = require('./utils/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const morganMiddleware = require('./utils/morganConf.js');

app.use(helmet()); // HTTP başlıklarını güvenli hale getirir

// Aynı IP'den gelen istekleri sınırlayarak brute force, DoS, credential stuffing gibi saldırıları önler
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use(express.json());
app.use(mongoSanitize()); // NoSQL enjeksiyonlarını önler
app.use(xss()); // XSS saldırılarını önler

// CORS politikalarının belirlenmesi
app.use(
  cors({
    origin: 'https://localhost:5173', // İzin verilen kökeni belirtin
    credentials: true, // Gerekiyorsa, bu ayarı true yaparak cookie'lerin gönderilmesine izin verin
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // İzin verilen HTTP yöntemlerini belirtin
  })
);

// Oturum yönetimi
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
      httpOnly: false,
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use('/api', limiter, userRouter); // API route'ının istek sınırlayıcı ile birlikte kullanılması

app.use(morganMiddleware);

app.all('*', (req, res, next) => {
  next(new AppError(`Cant't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
