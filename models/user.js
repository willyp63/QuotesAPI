'use strict'

const mongoose = require('mongoose');

module.exports = mongoose.model('User', {
  fname: String,
  lname: String,
  phone: String,
  pwd: String
});
