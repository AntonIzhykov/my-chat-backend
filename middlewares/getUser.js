const { getUserByTokenService } = require('../services/UserService');

const getUser = async (req, res, next) => {
  const { token } = req;
  try {
    const user = await getUserByTokenService(token);
    if (!user) res.status(404).send({ message: "Can't find user with such token" });
    req.user = user;
    next();
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = getUser;
