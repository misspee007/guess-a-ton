const path = require("path");
require("dotenv").config({ path: path.join(path.resolve("../"), ".env") });

exports.CONFIG = {
  PORT: process.env.PORT || 3001,
};