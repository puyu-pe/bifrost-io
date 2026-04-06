const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(__dirname, "env", process.env.NODE_ENV + '.env')
});

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3001,
  PRINTING_SERVICE_ENABLED: process.env.PRINTING_SERVICE_ENABLED === 'true',
}
