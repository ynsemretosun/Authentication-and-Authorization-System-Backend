const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
passport.use(
  // Google OAuth 2.0 konfigürasyonunun yapılandırılması
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://localhost:443/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    (accessToken, refreshToken, profile, done) => {
      // Profil bilgilerinin alınması
      profile = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value || 'Email not provided',
        photo: profile.photos[0].value || 'Photo not provided',
        userType: 'Google User',
      };
      done(null, profile); // Profil bilgilerinin döndürülmesi
    }
  )
);

// Passport'un serialize ve deserialize işlemlerinin yapılandırılması
passport.serializeUser((profile, done) => {
  done(null, profile);
});

passport.deserializeUser((profile, done) => {
  done(null, profile);
});

module.exports = passport;

// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: 'https://localhost:443/api/auth/google/callback',
//       scope: ['profile', 'email'],
//     },
//     (accessToken, refreshToken, profile, done) => {
//       profile = {
//         id: profile.id,
//         displayName: profile.displayName,
//         email: profile.emails[0].value || 'Email not provided',
//         photo: profile.photos[0].value || 'Photo not provided',
//         userType: 'Google User',
//       };
//       done(null, profile);
//     }
//   )
// );

// passport.serializeUser((profile, done) => {
//   done(null, profile);
// });

// passport.deserializeUser((profile, done) => {
//   done(null, profile);
// });

// module.exports = passport;
