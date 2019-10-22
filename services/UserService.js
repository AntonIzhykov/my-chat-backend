const User = require('../models/user');
const cloudinary = require('cloudinary');

getUserByTokenService = async token => {
  const { _id } = token;
  try {
    const user = await User.findOne({ _id }, { password: 0 }).populate({
      path: 'lastRoom',
      select: 'roomName'
    });
    if (user) return user;
  } catch (e) {
    throw e;
  }
};

getUserByIdService = async _id => {
  try {
    const user = await User.findOne({ _id });
    if (!user) return;
    return user;
  } catch (e) {
    throw e;
  }
};

updateUserDataService = async (user, newData) => {
  try {
    await user.set({ ...newData });
    await user.save();
    return user;
  } catch (e) {
    throw e;
  }
};

const uploadToCloudinary = (newAvatar, public_id) => {
  const { borderRadius, width, height, img, scale } = newAvatar;
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      img,
      {
        height,
        width,
        radius: borderRadius,
        zoom: scale,
        public_id,
        folder: 'avatars',
        overwrite: true,
        invalidate: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
  });
};

module.exports = {
  getUserByTokenService,
  getUserByIdService,
  updateUserDataService,
  uploadToCloudinary
};
