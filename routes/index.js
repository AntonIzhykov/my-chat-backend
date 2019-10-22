const express = require('express');
const router = express.Router();
const checkToken = require('../middlewares/checkToken');
const getUser = require('../middlewares/getUser');

const AuthController = require('../controllers/auth');
const UserController = require('../controllers/user');
const RoomController = require('../controllers/room');

router.get('/', (req, res) => res.status(200).json('Test page. Hello, API!'));

router.post('/auth', AuthController.authentication);

router.get('/user', checkToken, getUser, UserController.getCurrentUser);
router.patch('/user', checkToken, getUser, UserController.updateUser);
router.get('/rooms', RoomController.getAllRooms);
router.get('/report', checkToken, getUser, UserController.getReport);
router.post('/tempImg', checkToken, getUser, UserController.loadTempImage);

module.exports = router;
