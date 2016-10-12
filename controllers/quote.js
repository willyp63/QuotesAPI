'use strict'

const formatPhone = require('../util/formatPhone.js');

const Quote = require('../models/quote.js');

module.exports = {
  all: function (req, res) {

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
    // require params
    if (!req.body.text || !req.body.saidAt ||
        !req.body.saidBy || !req.body.heardBy) {
      return res.status(409).send({message: "Please provide a text, saidAt, saidBy, and heardBy."});
    }

    function handleDBError (err) {
      console.log(err);
      res.status(500).send({message: "db error..."});
    }

    // format phone numbers
    try {
      req.body.saidBy.phoneNumber = formatPhone(req.body.saidBy.phoneNumber);
      for (let i = 0; i < req.body.heardBy.length; i++) {
        req.body.heardBy[i].phoneNumber = formatPhone(req.body.heardBy[i].phoneNumber);
      }
    } catch (e) {
      return res.status(409).send({message: "That's not a valid phone number."});
    }

    Quote.postQuote(req.body.text, req.body.saidAt, req.body.saidBy, req.body.heardBy)
         .then(function (results) {
           res.status(200).send({message: "We did it!"});
         }).catch(handleDBError);
  }
};