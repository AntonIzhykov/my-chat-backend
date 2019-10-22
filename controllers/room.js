const { Room } = require('../models/room');

const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).populate('users', 'login -_id');
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
