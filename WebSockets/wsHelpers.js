const { sendError } = require('./wsBroadcasts');
const User = require('../models/user');
const Room = require('../models/room');
const Message = require('../models/message');

async function userJoinRoom(roomId, ws) {
  const room = await Room.findOne({ _id: roomId })
    .populate('users')
    .populate({ path: 'messages', populate: { path: 'author' } });

  const user = await User.findOne({ _id: ws.user._id });
  if (!room || !user) return { user, room };
  await user.set({
    ...user,
    currentRoom: roomId
  });
  if (!room.users.filter(roomUser => roomUser.toString() === user._id.toString()).length) {
    await room.users.push(user);
  }
  await room.save();
  await user.save();
  return { user, room };
}

async function userLeftRoom(ws) {
  const user = ws.user;
  if (!user) return;
  const { _id, currentRoom } = user;
  const room = await Room.findOne({ _id: currentRoom }).populate('users -_id');
  if (!room) return user;
  const lastRoom = {
    _id: room._id,
    roomName: room.roomName
  };
  await user.set({
    ...user,
    currentRoom: null,
    lastRoom: currentRoom
  });

  await room.set({
    ...room,
    users: room.users.filter(user => user._id.toString() !== _id.toString())
  });
  await room.save();
  await user.save();
  ws.send(JSON.stringify({ lastRoom }));
  return { user, currentRoom };
}

async function createRoom(roomName, ws) {
  return await Room.create({
    roomName,
    roomCreator: ws.user._id
  });
}

async function editRoom({ roomId, newRoomName }, ws) {
  const room = await Room.findOne({ _id: roomId });
  if (!room) return;
  if (room && room.roomCreator.toString() === ws.user._id.toString()) {
    room.set({
      roomName: newRoomName
    });
  }
  await room.save();
  return room;
}

async function deleteRoom(roomId, ws) {
  const room = await Room.findOne({ _id: roomId });
  if (room.roomCreator.toString() === ws.user._id.toString() || ws.user.isAdmin) {
    await room.messages.forEach(async message => {
      const msg = await Message.findOne({ _id: message });
      await msg.deleteOne();
    });

    await room.deleteOne();
    return roomId;
  } else {
    sendError('Forbidden!', ws);
  }
}

async function createMessage({ messageBody }, ws) {
  const newMessage = await Message.create({
    messageBody,
    author: ws.user,
    roomId: ws.currentRoom
  });
  await User.findOneAndUpdate({ _id: ws.user._id }, { $push: { messages: newMessage } });
  await Room.findOneAndUpdate({ _id: ws.currentRoom }, { $push: { messages: newMessage } });
  return newMessage;
}

async function editMessage({ messageBody, messageId }, ws) {
  const message = await Message.findOne({ _id: messageId }).populate('author');
  if (message && message.author._id.toString() === ws.user._id.toString()) {
    message.set({
      ...message,
      messageBody,
      isEdited: true,
      timeEdit: Date.now()
    });
    return await message.save();
  } else {
    sendError('Forbidden!', ws);
  }
}

async function deleteMessage(messageId, ws) {
  const message = await Message.findOne({ _id: messageId });
  if (message) {
    const room = await Room.findOne({ _id: message.roomId });
    if (!room) {
      return sendError('There is no such room!', ws);
    } else {
      if (message.author.toString() === ws.user._id.toString() || ws.user.isAdmin) {
        await message.deleteOne();
        return room._id;
      } else {
        sendError('Forbidden!', ws);
      }
    }
  } else {
    sendError('There is no such message!', ws);
  }
}

module.exports = {
  userJoinRoom,
  userLeftRoom,
  createRoom,
  editRoom,
  deleteRoom,
  createMessage,
  editMessage,
  deleteMessage
};
