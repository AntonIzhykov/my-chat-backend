const CONSTANTS = require('./wsConstants');
const Room = require('../models/room');
const { getUserByTokenService, checkTokenService } = require('../services');
const {
  authorization,
  userJoinRoom,
  userLeftRoom,
  createRoom,
  deleteRoom,
  createMessage,
  editMessage,
  deleteMessage
} = require('./wsHelpers');
const {
  broadcastJoinUser,
  broadcastLeftUser,
  broadcastNewRoom,
  broadcastDeleteRoom,
  broadcastNewMessage,
  broadcastEditMessage,
  broadcastDeleteMessage,
  sendError
} = require('./wsBroadcasts');

function runWebSockets(wss) {
  wss.on('connection', ws => {
    ws.on('message', async request => {
      const message = JSON.parse(request);

      if (!ws.user) {
        const token = await checkTokenService(message);
        if (token) {
          ws.token = message.token;
          ws.user = await getUserByTokenService(token);
        } else {
          await authorization(message, ws);
        }
      }

      switch (message.type) {
        case CONSTANTS.USER_JOIN_CHAT:
          const chatRooms = await Room.find({});
          ws.send(JSON.stringify({ user: ws.user, token: ws.token, chatRooms }));
          break;

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
      userLeftRoom(ws)
        .then(resp => {
          ws.currentRoom = null;
          broadcastLeftUser(resp.user, resp.currentRoom, wss);
        })
        .catch(error => sendError(error, ws));
    });
  });
}

module.exports = runWebSockets;
