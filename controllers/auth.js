const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config');

const authentication = async (req, res) => {
  try {
    const credentials = req.body;
    const { login, password } = credentials;
    if (!login || !password) res.status(400).send({ message: 'Bad credentials' });
    let user = await User.findOne({ login }).select('+password');
    if (user) {
      const result = await user.comparePasswords(password);
      if (result) {
        const token = jwt.sign({ _id: user._id }, config.authentication.secret);
        res.status(200).send({ token });
      } else {
        res.status(400).send({ message: 'Wrong password' });
      }
    } else {
      const userData = {
        ...credentials,
        isAdmin: credentials.isAdmin || false,
        avatar: {
          secure_url:
            'https://res.cloudinary.com/lanzz-lophophora/image/upload/v1571661800/avatars/defaultAvatar.jpg'
        }
      };
      user = await User.create(userData);
      const token = jwt.sign({ _id: user._id }, config.authentication.secret);
      res.status(200).send({ token });
    }
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = {
  authentication
};
