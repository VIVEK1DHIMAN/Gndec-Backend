const jwt = require('jsonwebtoken');
const { ERROR_TYPES } = require('../config/errorTypes');
const { TOKEN_SECRET } = require('../config/environment');

const { INVALID_TOKEN, USER_NOT_FOUND, SOMETHING_WENT_WRONG } = ERROR_TYPES;
const User = require('../models/user');

module.exports = async function (req, res, next) {
  try {
    const token = req.header('Authorization');
    if (token) {
      try {
        const result = await jwt.verify(token.replace('JWT ', ''), TOKEN_SECRET);
        const { _id, id } = result;
        const user = await User.findOne({ _id: _id || id });
        if (user) {
          delete user.password;
          req.user = user;
          return next();
        }
        return res.status(401).json({
          message: USER_NOT_FOUND,
        });
      } catch (err) {
        return res.status(400).json({
          message: INVALID_TOKEN,
        });
      }
    }
    return res.status(400).json({
      message: INVALID_TOKEN,
    });
  } catch (err) {
    return res.status(500).json({
      message: SOMETHING_WENT_WRONG,
    });
  }
};
