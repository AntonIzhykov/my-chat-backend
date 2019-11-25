const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  roomName: { type: String, trim: true, default: 'Default Room Name' },
  roomCreator: { type: Schema.Types.ObjectId, ref: 'User' },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }]
});

module.exports = mongoose.model('Room', RoomSchema);
