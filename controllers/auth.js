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
    try {
      // decode token and attach userId to request
      const payload = jwt.decode(token, "secret");
      req._userId = payload.sub.userId;
      next();
    } catch (e) {
      try {
        // decode even if expired
        const payload = jwt.decode(token, "secret", true);

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
            // user has logged out
            return res.status(401).send({message: "Blah Blah Invalid Auth Token."});
          }
        });
      } catch (e) {
        console.log(e);
        return res.status(401).send({message: "Invalid Auth Token."});
      }
    }
  },
  register: function (req, res) {
    // require params
    if (!req.body.phone || !req.body.pwd || !req.body.fname || !req.body.lname) {
      return res.status(409).send({message: "Please provide a fname, lname, phone, and pwd."});
    }

    // check for existing user
    try {
      const phoneNumber = formatPhone(req.body.phone);
      User.findOne({
        phone: phoneNumber
      }, function (err, existingUser) {
        if (existingUser) {
          return res.status(409).send({message: "Phone number is already registered."});
        }

        // create new user
        randomString(function (newSessionId) {
          const user = new User({
            fname: req.body.fname,
            lname: req.body.lname,
            phone: phoneNumber,
            pwd: req.body.pwd,
            sessionId: newSessionId
          });

          user.save(function (err, result) {
            if (err) {
              return res.status(500).send({message: err.message});
            }
            res.status(200).send({token: createToken(result)});
          });
        });
      });
    } catch (e) {
      res.status(409).send({message: "That's not a valid phone number."});
    }
  },
  login: function (req, res) {
    // require params
    if (!req.body.phone || !req.body.pwd) {
      return res.status(409).send({message: "Please provide a phone and pwd."});
    }

    // look up user by phone
    try {
      const phoneNumber = formatPhone(req.body.phone);
      User.findOne({
        phone: phoneNumber
      }, function (err, existingUser) {
        // check user and password
        if (!existingUser || existingUser.pwd !== req.body.pwd) {
          return res.status(401).send({message: "Invalid phone number and/or password."});
        }
        res.status(200).send({token: createToken(existingUser)});
      });
    } catch (e) {
      res.status(401).send({message: "That's not a valid phone number."});
    }
  },
  logout: function (req, res) {
    // change user's sessionId to a new random string
    randomString(function (newSessionId) {
      User.update({
        _id: req._userId
      }, {
        sessionId: newSessionId
      }, {}, function (err, newUser) {
        if (err) {
          return res.status(500).send({message: err.message});
        }
        res.status(200).send({message: "You're now logged out."});
      });
    });
  },
  refresh: function (req, res) {
    // extract payload
    const token = req.header("Authorization").split(' ')[1];
    const payload = jwt.decode(token, "secret");

    // send new token with same info
    res.status(200).send({token: createToken({
      _id: payload.sub.userId,
      sessionId: payload.sub.sessionId
    })});
  }
};

function createToken (user) {
  const payload = {
    sub: {
      userId: user._id,
      sessionId: user.sessionId
    },
    exp: moment().add(30, 'minutes').unix()
  };
  return jwt.encode(payload, 'secret');
}

function randomString (cb) {
  crypto.randomBytes(32, function(err, buffer) {
    cb(buffer.toString('hex'));
  });
}
