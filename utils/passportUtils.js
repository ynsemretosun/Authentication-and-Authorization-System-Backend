function authenticatePromise(req, strategy) {
  return new Promise((resolve, reject) => {
    passport.authenticate(strategy, (err, user, info) => {
      if (err) return reject(err);
      resolve({ user, info });
    })(req, null, (err) => {
      if (err) return reject(err);
    });
  });
}

module.exports = { authenticatePromise };
