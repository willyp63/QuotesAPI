'use strict'

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Quote', {
  text: String,
  date: String,
  said: { type: Schema.ObjectId, ref: 'User' },
  heard: [{ type: Schema.ObjectId, ref: 'User' }]
});
