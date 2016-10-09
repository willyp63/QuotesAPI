'use strict'

const jwt = require('jwt-simple');
const crypto = require('crypto');
const moment = require('moment');

const formatPhone = require('../util/formatPhone.js');

const User = require('../models/user.js');

module.exports = {
  requireAuth: function (req, res, next) {
    // check for header
    if (!req.header("Authorization")) {
      return res.status(401).send({
        message: "Please make sure your request has an Authorization header."
      });
    }

    // extract payload
    const token = req.header("Authorization").split(' ')[1];
    let payload;
    try {
      payload = jwt.decode(token, "secret");
    } catch (e) {
      return res.status(401).send({message: "Invalid Auth Token."});
    }

    // check payload expiration
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({message: "Your Auth Token has expired."});
    }

    // attach userId to request
    req._userId = payload.userId;
    next();
  },
  register: function (req, res) {
    if (!req.body.phone || !req.body.pwd) {
      return res.status(409).send({message: "Please provide a phone and pwd."});
    }

    const phoneNumber = formatPhone(req.body.phone);

    // check for existing user
    User.findOne({
      phone: phoneNumber
    }, function (err, existingUser) {
      if (existingUser) {
        return res.status(409).send({message: "Phone number is already registered."});
      }

      // create new user
      const user = new User({
        phone: phoneNumber,
        pwd: req.body.pwd
      });

      user.save(function (err, result) {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.status(200).send({token: createToken(result)});
      });
    });
  },
  login: function (req, res) {
    const phoneNumber = formatPhone(req.body.phone);

    User.findOne({
      phone: phoneNumber
    }, function (err, existingUser) {
      if (!existingUser || existingUser.pwd !== req.body.pwd) {
        return res.status(401).send({message: "Invalid phone number and/or password."});
      }
      res.status(200).send({token: createToken(existingUser)});
    });
  },
  refreshToken: function (req, res) {
    res.status(200).send({token: createToken({_id: req._userId})});
  }
};

function createToken (user) {
  const payload = {
    userId: user._id,
    iat: moment().unix(),
    exp: moment().add(60, 'days').unix()
  };
  return jwt.encode(payload, 'secret');
}
