const jwt = require('jsonwebtoken');
const config = require('../config');

const checkToken = async (req, res, next) => {
  try {
    const token = req.headers['authorization'];
    if (!token) res.status(403).send({ message: 'Forbidden. No token!' });
    req.token = jwt.verify(token, config.authentication.secret);
    next();
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = checkToken;
