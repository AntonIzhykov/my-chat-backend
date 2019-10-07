const mongoose = require('mongoose');
const { Schema } = mongoose;

const MessageSchema = new Schema({
  messageBody: { type: String, trim: true, required: true },
  author: {
    _id: { type: Schema.Types.ObjectId, ref: 'User' },
    login: String
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  isEdited: Boolean,
  timeCreate: { type: Date, default: Date.now },
  timeEdit: { type: Date, default: Date.now }
});

const RoomSchema = new Schema({
  roomName: { type: String, trim: true, default: 'Default Room Name' },
  roomCreator: {
    login: String,
    _id: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  users: [
    {
      login: String,
      _id: { type: Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  messages: [MessageSchema]
});

module.exports = mongoose.model('Room', RoomSchema);
