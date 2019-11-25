const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./user');
const Room = require('./room');

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

MessageSchema.pre('deleteOne', { query: true, document: true }, async function(next) {
  await User.findOneAndUpdate({ _id: this.author }, { $pull: { messages: this._id } });
  await Room.findOneAndUpdate({ _id: this.roomId }, { $pull: { messages: this._id } });
  next();
});

module.exports = mongoose.model('Message', MessageSchema);
