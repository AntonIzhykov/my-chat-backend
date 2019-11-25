function broadcastJoinUser(data, ws, wss) {
  const { user, room } = data;
  wss.clients.forEach(client => {
    client.send(
      JSON.stringify({
        userJoinedRoom: {
          roomId: room._id,
          user: {
            login: user.login,
            _id: user._id
          }
        }
      })
    );
    // }
  });
}
function broadcastLeftUser(user, roomId, wss) {
  wss.clients.forEach(client => {
    client.send(
      JSON.stringify({
        userLeftRoom: {
          userId: user._id,
          roomId
        }
      })
    );
  });
}

function broadcastNewRoom(newRoom, wss) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ newRoom }));
  });
}
function broadcastEditRoom(editedRoom, wss) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ roomEdited: editedRoom }));
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

function broadcastUserHasBeenChanged(user, wss) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ userHasBeenChanged: user }));
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
  broadcastEditRoom,
  broadcastDeleteRoom,
  broadcastNewMessage,
  broadcastEditMessage,
  broadcastDeleteMessage,
  broadcastUserHasBeenChanged,
  sendError
};
