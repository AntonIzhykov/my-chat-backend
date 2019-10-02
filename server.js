const WebSocket = require('ws');
const express = require('express');
const docs = require('express-mongoose-docs');
const mongoose = require('mongoose');
const config = require('./config/');
const connectDatabase = require('./db');
const runWebSockets = require('./WebSockets/WebSockets');

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

  const wss = new WebSocket.Server({ server });
  runWebSockets(wss);

  docs(app, mongoose);
}
