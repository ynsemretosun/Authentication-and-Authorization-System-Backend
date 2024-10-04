const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
passport.use(
  // Facebook OAuth 2.0 konfigürasyonunun yapılandırılması
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: 'https://localhost:443/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'photos', 'email'],
    },
    (accessToken, refreshToken, profile, done) => {
      // Profil bilgilerinin alınması
      profile = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value || 'Email not provided',
        photo:
          'https://graph.facebook.com/' + profile.id + '/picture?type=large' ||
          'Photo not provided',
        userType: 'Facebook User',
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
