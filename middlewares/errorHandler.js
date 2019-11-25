const errorHandler = (err, req, res) => {
  let { status = 500, message = 'Server Error' } = err;

  return res.status(status).json({ message });
};

module.exports = errorHandler;
