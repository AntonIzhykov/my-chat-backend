const Room = require('../models/room');

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate('users', 'login -_id')
      .populate({ path: 'messages', populate: { path: 'author' } });
    res.status(200).send({ rooms });
  } catch (error) {
    res.status(500).send({ error });
  }
};

const getRoom = async (req, res) => {
  res.status(200).send(req.Room);
};

module.exports = {
  getAllRooms,
  getRoom
};
