const onlyForAdmin = async (req, res, next) => {
  if (!req.user.isAdmin)
    res.status(403).send({ message: 'Forbidden! This page is available only for administrators.' });
  next();
};

module.exports = onlyForAdmin;
