const { sendError } = require('./wsBroadcasts');
const User = require('../models/user');
const { Room } = require('../models/room');

async function userJoinRoom(roomId, ws) {
  const room = await Room.findOne({ _id: roomId })
    .populate('users -_id')
    .populate('messages.author');

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
    roomCreator: ws.user._id,
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
      author: ws.user,
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
  const room = await Room.findOne({ _id: ws.currentRoom }).populate('messages.author');
  if (room) {
    const message = room.messages.id(messageId);
    if (message && message.author._id.toString() === ws.user._id.toString()) {
      message.set({
        ...message,
        messageBody,
        isEdited: true,
        timeEdit: Date.now()
      });
      const newMessage = await room.messages.id(messageId);
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

async function updateUserData(newData, ws) {
  if (newData.password) {
    const { _id } = ws.user;
    const user = await User.findOne({ _id }).select('+password');
    const result = await user.comparePasswords(newData.password);
    if (result) {
      if (newData.avatar && newData.avatar.length) {
        await uploadToCloudinary(newData.avatar, _id)
          .then(async cloudinaryData => {
            if (user.avatar && user.avatar.remote_id) {
              cloudinary.v2.uploader.destroy(user.avatar.remote_id, error => {
                if (error) {
                  sendError(error, ws);
                }
              });
            }
            await user.set({
              avatar: {
                secure_url: cloudinaryData.secure_url,
                public_id: cloudinaryData.public_id
              }
            });
          })
          .catch(err => console.log(err));
      }

      if (newData.login && newData.login !== user.login) {
        await user.set({
          login: newData.login
        });
      }

      if (newData.email && newData.email !== 'undefined' && newData.email !== user.email) {
        await user.set({
          email: newData.email
        });
      }

      if (newData.newPassword) {
        await user.set({
          password: newData.newPassword
        });
      }

      await user.save();
      const newUser = await User.findOne({ _id });
      ws.user = newUser;
      return newUser;
    } else {
      sendError('Wrong password', ws);
    }
  } else {
    sendError('Enter your password first!', ws);
  }
}

module.exports = {
  userJoinRoom,
  userLeftRoom,
  createRoom,
  deleteRoom,
  createMessage,
  editMessage,
  deleteMessage,
  updateUserData
};
