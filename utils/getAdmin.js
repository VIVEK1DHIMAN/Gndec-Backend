/* eslint-disable no-async-promise-executor */
const User = require('../models/user');

const getAdmin = () => new Promise(async (resolve, reject) => {
  try {
    const { id, name, email } = await User.findOne({ isAdmin: true });
    resolve({ id, name, email });
  } catch (err) {
    reject(err);
  }
});

module.exports = {
  getAdmin,
};
