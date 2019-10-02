const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/user');

const checkTokenService = async data => {
  try {
    const { token } = data;
    if (token) return jwt.verify(token, config.authentication.secret);
  } catch (error) {
    return { error };
  }
};

getUserByTokenService = async token => {
  const { _id } = token;
  try {
    const user = await User.findOne({ _id }, { password: 0 });
    if (user) return user;
  } catch (e) {
    throw e;
  }
};

module.exports = { checkTokenService, getUserByTokenService };
