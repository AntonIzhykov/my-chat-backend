const jwt = require('jsonwebtoken');
const config = require('../config');
const { sendError } = require('./wsBroadcasts');
const { checkTokenService, getUserByTokenService } = require('../services');
const User = require('../models/user');
const Room = require('../models/room');

async function authorization(message, ws) {
  if (message.token) {
    const token = await checkTokenService(message);
    ws.user = await getUserByTokenService(token);
  } else {
    const { login, password } = message.data;

    if (!login || !password) {
      sendError('Bad credentials', ws);
      return;
    }
    let user = await User.findOne({ login });
    if (!user) {
      user = await User.create({ login, password });
    }
    const result = await user.comparePasswords(password);
    if (result) {
      ws.token = jwt.sign({ _id: user._id }, config.authentication.secret);
      ws.user = user;
    } else {
      sendError('Wrong password', ws);
    }
  }
}

async function userJoinRoom(roomId, ws) {
  const room = await Room.findOne({ _id: roomId });
  const user = await User.findOne({ _id: ws.user._id });
  if (!room || !user) return { user, room };
  await user.set({
    ...user,
    currentRoom: roomId
  });
  if (!room.users.filter(roomUser => roomUser._id.toString() === user._id.toString()).length) {
    await room.users.push(user);
  }
  await room.save();
  await user.save();
  return { user, room };
}

async function userLeftRoom(ws) {
  const user = ws.user;
  const { _id, currentRoom } = user;
  const room = await Room.findOne({ _id: currentRoom });
  await user.set({
    ...user,
    currentRoom: null
  });
  if (!room) return user;

  await room.set({
    ...room,
    users: room.users.filter(user => user._id.toString() !== _id.toString())
  });
  await room.save();
  await user.save();
  return { user, currentRoom };
}

async function createRoom(roomName, ws) {
  return await Room.create({
    roomName,
    roomCreator: ws.user,
    users: [],
    messages: []
  });
}
async function deleteRoom(roomId, ws) {
  const room = await Room.findOne({ _id: roomId });
  if (room.roomCreator._id.toString() === ws.user._id.toString()) {
    await room.remove();
    return roomId;
  } else {
    sendError('Forbidden!', ws);
  }
}

async function createMessage({ messageBody }, ws) {
  const room = await Room.findOne({ _id: ws.currentRoom });
  if (room) {
    room.messages.push({
      messageBody,
      author: {
        _id: ws.user._id,
        login: ws.user.login
      },
      roomId: room._id
    });
    const newMessage = room.messages.find(message => message.isNew);
    await room.save();
    return newMessage;
  } else {
    sendError('There is no such room!', ws);
  }
}

async function editMessage({ messageBody, messageId }, ws) {
  const room = await Room.findOne({ _id: ws.currentRoom });
  if (room) {
    const message = room.messages.id(messageId);
    if (message.author._id.toString() === ws.user._id.toString()) {
      message.set({
        ...message,
        messageBody,
        timeEdit: Date.now()
      });
      const newMessage = room.messages.id(messageId);
      await room.save();
      return newMessage;
    } else {
      sendError('Forbidden!', ws);
    }
  } else {
    sendError('There is no such room!', ws);
  }
}

async function deleteMessage(messageId, ws) {
  const room = await Room.findOne({ _id: ws.currentRoom });
  if (room) {
    const message = room.messages.id(messageId);
    if (message.author._id.toString() === ws.user._id.toString()) {
      message.remove();
      await room.save();
      return room._id;
    } else {
      sendError('Forbidden!', ws);
    }
  } else {
    sendError('There is no such room!', ws);
  }
}

module.exports = {
  authorization,
  userJoinRoom,
  userLeftRoom,
  createRoom,
  deleteRoom,
  createMessage,
  editMessage,
  deleteMessage
};
