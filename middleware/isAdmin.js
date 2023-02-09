const jwt = require('jsonwebtoken');
const { TOKEN_SECRET } = require('../config/environment');

module.exports = function (req, res, next) {
  const token = req.header('Authorization');
  jwt.verify(token.replace('JWT ', ''), TOKEN_SECRET, (err, verifiedJwt) => {
    if (err) {
      res.send({ success: false, msg: err.message });
    }
    if (verifiedJwt.isAdmin) {
      next();
    } else {
      res.status(401).send({ success: false, msg: 'UNAUTHORIZED' });
    }
    return verifiedJwt;
  });
};
