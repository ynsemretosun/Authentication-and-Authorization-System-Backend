const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();
const passport = require('passport');
const cookieParser = require('cookie-parser');
router.use(cookieParser());
router.post('/login', authController.loginWithLdap);
router.post('/verifyOtp', authController.verifyOtp);
router.get('/resendOtp', authController.resendOtp);
router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }) // Google OAuth 2.0 ile kimlik doğrulama
);
router.get('/auth/google/callback', authController.googleCallback);
router.get('/logout', authController.logout);
router.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }) // GitHub OAuth 2.0 ile kimlik doğrulama
);
router.get('/auth/github/callback', authController.githubCallback);
router.get(
  '/auth/facebook',
  passport.authenticate('facebook', { scope: ['email', 'public_profile'] })
);
router.get('/auth/facebook/callback', authController.facebookCallback);
router.get('/profile', authController.getUser);

router.get(
  '/protected',
  authController.protect,
  authController.restrictedTo('user', 'admin'),
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Hello From Restricted and Protected Page!',
    });
  }
);
module.exports = router;
