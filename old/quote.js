'use strict'

const Quote = require('../models/quote.js');

const formatPhone = require('../util/formatPhone.js');

module.exports = {
  all: function (req, res) {
    Quote.find({}, function (err, quotes) {
      res.status(200).send(quotes);
    });
  },
  mine: function (req, res) {
    const query = req.query.q;
    res.status(200).send({message: query});
  },
  mySaid: function (req, res) {

  },
  myHeard: function (req, res) {

  },
  post: function (req, res) {
      // TODO
      console.log(req.body);
      res.status(200).send({});
  }
};
