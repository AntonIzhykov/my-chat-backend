const config = {
  database: 'mongodb://localhost:27017/my-chat-db',
  host: 'localhost',
  port: 5000,
  authentication: {
    secret: 'qjdijiqj#r2f4fw43wccdkca[fjef'
  },
  cloudinary: {
    cloud_name: 'lanzz-lophophora',
    api_key: '273475875782157',
    api_secret: 'CJsSS13ImGn6WQwBTYq1A2NWPQc'
  },
  defaultAvatar:
    'https://res.cloudinary.com/lanzz-lophophora/image/upload/v1571661800/avatars/defaultAvatar.jpg'
};

module.exports = config;
