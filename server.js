const express = require('express');
const session = require('express-session');
const docs = require('express-mongoose-docs');
const formData = require('express-form-data');
const morgan = require('morgan');
const mongoose = require('mongoose');
const config = require('./config/');
const router = require('./routes');
const os = require('os');
const connectDatabase = require('./db');
const { runWebSockets } = require('./WebSockets/WebSockets');
const cloudinary = require('cloudinary');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const schema = require('./graphQL/schema');
const cors = require('cors');

cloudinary.config({
  cloud_name: config.cloudinary.cloud_name,
  api_key: config.cloudinary.api_key,
  api_secret: config.cloudinary.api_secret
});

connectDatabase()
  .on('disconnect', connectDatabase)
  .once('open', runServer);

function runServer() {
  const app = express();
  config.port = config.port || process.env.PORT;

  const server = app.listen(config.port, function(err) {
    if (err) throw err;
    console.log(
      `🏠 MY-CHAT-APP is up and running in ${process.env.NODE_ENV} mode at https://${config.host}:${config.port}`
    );
  });

  runWebSockets(server);

  const options = {
    uploadDir: os.tmpdir(),
    autoClean: true
  };

  docs(app, mongoose);
  app.use(cors());
  app.use(morgan('tiny'));

  app.use(
    '/graphql',
    graphqlHTTP({
      schema,
      graphiql: true
    })
  );

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(formData.parse(options));
  app.use(formData.format());
  app.use(formData.stream());
  app.use(formData.union());
  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: config.authentication.secret
    })
  );
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PATCH, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Login, Password, authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });

  app.use('/api', router);
}
