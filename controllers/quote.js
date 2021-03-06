'use strict'

const formatPhone = require('../util/formatPhone.js');
const database = require('../database/database.js');
const Quote = require('../models/quote.js');

module.exports = {
  mine: function (req, res) {
    const query = req.query.q;
    if (query) {
      Quote.myAggregatedQuotesWithQuery(req._userId, query)
           .then(function (quotes) {
             res.status(200).send({quotes: quotes});
           }).catch(database.sendDBErrorResponse.bind(null, res));
    } else {
      Quote.myAggregatedQuotes(req._userId)
           .then(function (quotes) {
             res.status(200).send({quotes: quotes});
           }).catch(database.sendDBErrorResponse.bind(null, res));
    }
  },
  mySaid: function (req, res) {
    Quote.mySaidAggregatedQuotes(req._userId)
         .then(function (quotes) {
           res.status(200).send({quotes: quotes});
         }).catch(database.sendDBErrorResponse.bind(null, res));
  },
  myHeard: function (req, res) {
    Quote.myHeardAggregatedQuotes(req._userId)
         .then(function (quotes) {
           res.status(200).send({quotes: quotes});
         }).catch(database.sendDBErrorResponse.bind(null, res));
  },
  post: function (req, res) {
    // require params
    if (!req.body.text || !req.body.saidAt ||
        !req.body.saidBy || !req.body.heardBy) {
      return res.status(409).send({message: "Please provide a text, saidAt, saidBy, and heardBy."});
    }

    // format phone numbers
    try {
      req.body.saidBy.phoneNumber = formatPhone(req.body.saidBy.phoneNumber);
      for (let i = 0; i < req.body.heardBy.length; i++) {
        req.body.heardBy[i].phoneNumber = formatPhone(req.body.heardBy[i].phoneNumber);
      }
    } catch (e) {
      return res.status(409).send({message: "That's not a real phone number!"});
    }

    Quote.insertQuoteWithRawFormData(req.body.text, req.body.saidAt, req.body.saidBy, req.body.heardBy)
         .then(function (results) {
           res.status(200).send({message: "Quote posted successfully!"});
         }).catch(database.sendDBErrorResponse.bind(null, res));
  }
};
