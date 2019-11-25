const CONSTANTS = require('./wsConstants');
const WebSocket = require('ws');
const { getUserByTokenService, checkTokenService } = require('../services');
const {
  userJoinRoom,
  userLeftRoom,
  createRoom,
  editRoom,
  deleteRoom,
  createMessage,
  editMessage,
  deleteMessage,
  updateUserData
} = require('./wsHelpers');
const {
  broadcastJoinUser,
  broadcastLeftUser,
  broadcastNewRoom,
  broadcastEditRoom,
  broadcastDeleteRoom,
  broadcastNewMessage,
  broadcastEditMessage,
  broadcastDeleteMessage,
  broadcastUserHasBeenChanged,
  sendError
} = require('./wsBroadcasts');

let wss = null;

const getSockets = () => {
  return wss;
};

function runWebSockets(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', ws => {
    ws.on('message', async request => {
      const message = JSON.parse(request);

      console.log('MESSAGE =>', message);
      if (!ws.user) {
        const token = await checkTokenService(message);
        if (token) {
          ws.token = message.token;
          ws.user = await getUserByTokenService(token);
        }
      }

      switch (message.type) {
        case CONSTANTS.USER_LEFT_CHAT:
          userLeftRoom(ws)
            .then(resp => {
              ws.currentRoom = null;
              broadcastLeftUser(resp.user, resp.currentRoom, wss);
            })
            .catch(error => sendError(error, ws));
          ws.user = null;
          ws.token = null;
          ws.send(JSON.stringify({ userLeftChat: true }));
          ws.close();
          break;

        case CONSTANTS.USER_JOINED_ROOM:
          userJoinRoom(message.data.roomId, ws)
            .then(data => {
              if (data.user && data.room) {
                ws.send(
                  JSON.stringify({
                    currentRoom: data.room
                  })
                );
                ws.user.currentRoom = message.data.roomId;
                ws.currentRoom = message.data.roomId;
                broadcastJoinUser(data, ws, wss);
              } else {
                let textError = '';
                if (!data.room) {
                  textError += 'There is no such room! ';
                }
                if (!data.user) {
                  textError += 'There is no such user!';
                }
                sendError(textError, ws);
              }
            })
            .catch(error => sendError(error, ws));
          break;
        case CONSTANTS.USER_LEFT_ROOM:
          userLeftRoom(ws)
            .then(resp => {
              ws.currentRoom = null;
              broadcastLeftUser(resp.user, resp.currentRoom, wss);
            })
            .catch(error => sendError(error, ws));
          break;

        case CONSTANTS.CREATE_ROOM:
          createRoom(message.data.roomName, ws)
            .then(room => {
              broadcastNewRoom(room, wss);
            })
            .catch(error => sendError(error, ws));
          break;
        case CONSTANTS.EDIT_ROOM:
          editRoom(message.data, ws)
            .then(room => {
              broadcastEditRoom(room, wss);
            })
            .catch(error => sendError(error, ws));
          break;
        case CONSTANTS.DELETE_ROOM:
          deleteRoom(message.data.roomId, ws)
            .then(roomId => {
              broadcastDeleteRoom(roomId, wss);
            })
            .catch(error => sendError(error, ws));
          break;

        case CONSTANTS.NEW_MESSAGE:
          createMessage(message.data, ws)
            .then(data => {
              broadcastNewMessage(data, wss);
            })
            .catch(error => sendError(error, ws));
          break;
        case CONSTANTS.EDIT_MESSAGE:
          editMessage(message.data, ws)
            .then(editedMessage => broadcastEditMessage(editedMessage, wss))
            .catch(error => sendError(error, ws));
          break;
        case CONSTANTS.DELETE_MESSAGE:
          deleteMessage(message.data.messageId, ws)
            .then(roomId => broadcastDeleteMessage(roomId, message.data.messageId, wss))
            .catch(error => sendError(error, ws));
          break;

        case CONSTANTS.UPDATE_USER_DATA:
          updateUserData(message.data, ws)
            .then(user => broadcastUserHasBeenChanged(user, wss))
            .catch(error => sendError(error, ws));
          break;

        default: {
          console.log('entered message => ', message);
        }
      }
    });

    ws.on('error', e => {
      sendError(e.message);
    });
    ws.on('close', e => {
      console.log('websocket closed ' + e);
      ws.user &&
        userLeftRoom(ws)
          .then(resp => {
            ws.currentRoom = null;
            broadcastLeftUser(resp.user, resp.currentRoom, wss);
          })
          .catch(error => sendError(error, ws));
    });
  });
}

module.exports = {
  runWebSockets,
  getSockets
};
