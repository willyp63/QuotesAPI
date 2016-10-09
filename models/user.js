const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  name: String,
  phone: String,
  pwd: String
});
