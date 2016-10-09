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

    // check token expiration
    if (payload.exp <= moment().unix()) {
      // check if session is still open
      User.findOne({
        _id: payload.sub.userId,
        sessionId: payload.sub.sessionId
      }, function (err, existingUser) {
        if (existingUser) {
          // issue new auth token and ask that request be made again
          return res.status(401).send({message: "Your auth token has expired. Here's a new one to try again with.",
                                       token: createToken(existingUser)});
        } else {
          return res.status(401).send({message: "Invalid Auth Token."});
        }
      })
    } else {
      // attach userId to request
      req._userId = payload.sub.userId;
      next();
    }
  },
  register: function (req, res) {
    if (!req.body.phone || !req.body.pwd || !req.body.fname || !req.body.lname) {
      return res.status(409).send({message: "Please provide a fname, lname, phone, and pwd."});
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
      randomString(function (sessionId) {
        const user = new User({
          fname: req.body.fname,
          lname: req.body.lname,
          phone: phoneNumber,
          pwd: req.body.pwd,
          sessionId: sessionId
        });

        user.save(function (err, result) {
          if (err) {
            return res.status(500).send({message: err.message});
          }
          res.status(200).send({token: createToken(result)});
        });
      });
    });
  },
  login: function (req, res) {
    if (!req.body.phone || !req.body.pwd) {
      return res.status(409).send({message: "Please provide a phone and pwd."});
    }

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
  logout: function (req, res) {
    randomString(function (newSessionId) {
      User.update({
        _id: req.userId
      }, {
        $set: {sessionId: newSessionId}
      });
    });
  }
};

function createToken (user) {
  const payload = {
    sub: {
      userId: user._id,
      sessionId: user.sessionId
    },
    exp: moment().add(1, 'minutes').unix()
  };
  return jwt.encode(payload, 'secret');
}

function randomString (cb) {
  crypto.randomBytes(48, function(err, buffer) {
    cb(buffer.toString('hex'));
  });
}
