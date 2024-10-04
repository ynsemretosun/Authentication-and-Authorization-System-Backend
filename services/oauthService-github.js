const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
passport.use(
  // GitHub OAuth 2.0 konfigürasyonunun yapılandırılması
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'https://localhost:443/api/auth/github/callback',
      scope: ['user:email'],
    },
    (accessToken, refreshToken, profile, done) => {
      // Profil bilgilerinin alınması
      profile = {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value || 'Email not provided',
        photo: profile.photos[0].value || 'Photo not provided',
        userType: 'Github User',
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
