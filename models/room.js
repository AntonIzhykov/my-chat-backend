const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  messageBody: { type: String, trim: true, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  isEdited: { type: Boolean, default: false },
  timeCreate: { type: Date, default: Date.now },
  timeEdit: { type: Date, default: Date.now }
});

const RoomSchema = new Schema({
  roomName: { type: String, trim: true, default: 'Default Room Name' },
  roomCreator: { type: Schema.Types.ObjectId, ref: 'User' },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  messages: [MessageSchema]
});

const Room = mongoose.model('Room', RoomSchema);
const Message = mongoose.model('Message', MessageSchema);

module.exports = {
  Room,
  Message
};
