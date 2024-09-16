const express = require('express');
const app = express();
const cors = require('cors');
const session = require('express-session');
const userRouter = require('./routes/UserRoutes.js');
const passport = require('passport');
const passportSetupGoogle = require('./services/oauthService-google.js');
const passportSetupGithub = require('./services/oauthService-github.js');
const passportSetupFacebook = require('./services/oauthService-facebook.js');
const auth = require('./services/oauthService-google.js');
const AppError = require('./utils/appError.js');
const cookieParser = require('cookie-parser');
const globalErrorHandler = require('./controllers/errorController.js');
const cookieSession = require('cookie-session');
const morganMiddleware = require('./utils/morganConf.js');
// app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: 'https://localhost:5173', // İzin verilen kökeni belirtin
    credentials: true, // Gerekiyorsa, bu ayarı true yaparak cookie'lerin gönderilmesine izin verin
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // İzin verilen HTTP yöntemlerini belirtin
  })
);

// app.use(
//   cookieSession({
//     name: 'session',
//     keys: ['yunus'],
//     maxAge: 24 * 60 * 60 * 1000,
//   })
// );
app.use(
  session({
    secret: 'secret123',
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

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'keyboard cat',
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       httpOnly: true,
//       secure: false,
//       sameSite: 'None',
//     },
//   })
// );

app.use(morganMiddleware);
app.use('/api', userRouter);

app.get('/homepage', (req, res) => {
  res.send("<a href='/auth/google'>Login with Google</a>");
});
app.get('/googled', (req, res) => {
  res.status(200).json({ message: "Google'd" });
});

// app.get(
//   '/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/homepage' }),
//   function (req, res) {
//     // Successful authentication, redirect home.
//     res.redirect('/googled');
//   }
// );
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'failed',
  //   messsage: `Can't find ${req.originalUrl} on this server!`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  // err.statusCode = 404;
  // err.status = 'failed';
  next(new AppError(`Cant't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
