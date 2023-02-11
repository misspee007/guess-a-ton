require('dotenv').config();

exports.CONFIG = {
  PORT: process.env.PORT || 3001,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/guessing-game',
};