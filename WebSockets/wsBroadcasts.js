function broadcastJoinUser(data, ws, wss) {
  const { user, room } = data;
  wss.clients.forEach(client => {
    if (
      client.currentRoom &&
      client.currentRoom.toString() === room._id.toString() &&
      client !== ws
    ) {
      client.send(
        JSON.stringify({
          userJoinedRoom: {
            login: user.login,
            _id: user._id
          }
        })
      );
    }
  });
}
function broadcastLeftUser(user, roomId, wss) {
  wss.clients.forEach(client => {
    if (client.currentRoom && client.currentRoom.toString() === roomId.toString()) {
      client.send(
        JSON.stringify({
          userLeftRoom: user._id
        })
      );
    }
  });
}

function broadcastNewRoom(newRoom, wss) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ newRoom }));
  });
}
function broadcastDeleteRoom(roomId, wss) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ roomDeleted: roomId }));
  });
}

function broadcastNewMessage(newMessage, wss) {
  wss.clients.forEach(client => {
    if (client.currentRoom && client.currentRoom.toString() === newMessage.roomId.toString()) {
      client.send(JSON.stringify(newMessage));
    }
  });
}
function broadcastEditMessage(editedMessage, wss) {
  wss.clients.forEach(client => {
    if (client.currentRoom && client.currentRoom.toString() === editedMessage.roomId.toString()) {
      client.send(JSON.stringify({ messageEdited: editedMessage }));
    }
  });
}
function broadcastDeleteMessage(roomId, messageId, wss) {
  wss.clients.forEach(client => {
    if (client.currentRoom && client.currentRoom.toString() === roomId.toString()) {
      client.send(JSON.stringify({ messageDeleted: messageId }));
    }
  });
}

function sendError(textError, ws) {
  console.log('error', textError);
  ws.send(JSON.stringify({ error: { message: textError } }));
}
module.exports = {
  broadcastJoinUser,
  broadcastLeftUser,
  broadcastNewRoom,
  broadcastDeleteRoom,
  broadcastNewMessage,
  broadcastEditMessage,
  broadcastDeleteMessage,
  sendError
};