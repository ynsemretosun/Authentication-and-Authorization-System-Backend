const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const ldapService = require('../services/ldapService');
const oauthService = require('../services/oauthService-google');
const passport = require('passport');
const otpTest = require('../services/otpTest');
const cookieParser = require('cookie-parser');
const otpService = require('../services/otpService');
router.use(cookieParser());
router.post('/login', authController.loginWithLdap);
router.post('/verifyOtp', authController.verifyOtp);
router.get('/resendOtp', authController.resendOtp);
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/logout', authController.logout);
router.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
);
router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);
router.get('/auth/google/callback', authController.googleCallback);
router.get('/auth/github/callback', authController.githubCallback);
router.get('/auth/facebook/callback', authController.facebookCallback);

router.get('/auth/google/failure', authController.googleFailure);
router.get('/profile', authController.getUser);

// router.get('/logout', (req, res) => {
//   req.logout();
//   res.status(200).json({ message: 'Logged out successfully!' });
// });
router.get(
  '/protected',
  authController.protect,
  authController.restrictedTo('AdMin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Hello From Restricted and Protected Page!',
    });
  }
);

router.get('/hi', (req, res) => {
  res.status(200).json({ message: 'Hello World!' });
});
module.exports = router;
