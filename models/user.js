const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;

const UserSchema = new Schema({
  login: String,
  password: String,
  isAdmin: Boolean,
  currentRoom: { type: Schema.Types.ObjectId, ref: 'Room' },
  lastRoom: { type: Schema.Types.ObjectId, ref: 'Room' }
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePasswords = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
