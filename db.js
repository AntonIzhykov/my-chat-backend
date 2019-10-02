const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('./config');

const connectDatabase = () => {
  mongoose.Promise = bluebird;
  mongoose.connect(`${config.database}`, { useNewUrlParser: true }, console.log('Mongo connected'));
  mongoose.set('useFindAndModify', false);
  mongoose.set('useCreateIndex', true);
  return mongoose.connection;
};

module.exports = connectDatabase;
