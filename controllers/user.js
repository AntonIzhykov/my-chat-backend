const {
  getUserByIdService,
  updateUserDataService,
  uploadToCloudinary
} = require('../services/UserService');
const User = require('../models/user');
const Room = require('../models/room');
const Message = require('../models/message');
const { getSockets } = require('../WebSockets/WebSockets');
const { broadcastUserHasBeenChanged } = require('../WebSockets/wsBroadcasts');
const cloudinary = require('cloudinary');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    users && res.status(200).send({ users });
  } catch (error) {
    res.status(500).send({ error });
  }
};

const deleteUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) res.status(404).send({ message: "Can't find user with such id" });
    await user.deleteOne({ _id: user.id });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).send({ error });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) res.status(404).send({ message: "Can't find user with such id" });
    res.status(200).send({ user });
  } catch (error) {
    res.status(500).send({ error });
  }
};

const getCurrentUser = async (req, res) => {
  res.status(200).send(req.user);
};

const makeUserDisable = async (req, res) => {
  try {
    if (req.user.isAdmin) res.status(418).send({ message: 'Негоже админу удалять свою учетку!' });
    const result = updateUserDataService(req.user, { disable: true });
    result && res.sendStatus(200);
  } catch (error) {
    res.status(500).send({ error });
  }
};

const loadTempImage = async (req, res) => {
  try {
    const {
      body: { img },
      user: { _id }
    } = req;
    await uploadToCloudinary({ img }, `${_id}-temporary`)
      .then(async cloudinaryData => {
        return res.status(200).send(cloudinaryData.secure_url);
      })
      .catch(err => {
        res.status(500).send({ err });
      });
  } catch (error) {
    res.status(500).send({ error });
  }
};

const updateUser = async (req, res) => {
  try {
    const wss = getSockets();
    const {
      userData: { password, newPassword, login, email, newAvatar }
    } = req.body;

    if (!password) return res.status(418).send({ message: 'Enter your password!' });
    const { _id } = req.user;
    const user = await User.findOne({ _id }).select('+password');
    if (!user) return res.status(404).send({ message: "Can't find user with such id" });
    const result = await user.comparePasswords(password);
    if (!result) return res.status(400).send({ message: 'Wrong password!' });

    if (newAvatar) {
      await uploadToCloudinary(newAvatar, _id)
        .then(async cloudinaryData => {
          const tempImage = `avatars/${_id}-temporary`;
          await cloudinary.v2.uploader.destroy(tempImage);
          await user.set({
            avatar: {
              secure_url: cloudinaryData.secure_url,
              public_id: cloudinaryData.public_id
            }
          });
        })
        .catch(err => console.log(err));
    }

    if (login && login !== user.login) {
      await user.set({
        login
      });
    }

    if (email && email !== 'undefined' && email !== user.email) {
      await user.set({
        email
      });
    }

    if (newPassword) {
      await user.set({
        password: newPassword
      });
    }

    await user.save();
    const newUser = await User.findOne({ _id });

    res.status(200).send(newUser);

    broadcastUserHasBeenChanged(newUser, wss);
  } catch (error) {
    res.status(500).send({ error });
  }
};

const getReport = async (req, res) => {
  try {
    const allUsers = await User.find({}).populate('messages');
    const allRooms = await Room.find({}).populate('messages users');
    const allMessages = await Message.find({}).populate('author');

    const user = req.user;
    const userRooms = await Room.find({ roomCreator: user._id });
    const userMessages = await Message.find({ author: user._id });
    const report = {
      allRooms,
      allMessages,
      allUsers,
      user,
      userRooms,
      userMessages
    };

    res.status(200).send({ report });
  } catch (error) {
    res.status(500).send({ error });
  }
};

module.exports = {
  getAllUsers,
  getCurrentUser,
  makeUserDisable,
  updateUser,
  deleteUserById,
  getUserById,
  getReport,
  loadTempImage
};
