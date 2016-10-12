'use strict'

const jwt = require('jwt-simple');
const moment = require('moment');
const passwordHasher = require('password-hash-and-salt');
const formatPhone = require('../util/formatPhone.js');
const database = require('../database/database.js');
const User = require('../models/user.js');

module.exports = {
  register: function (req, res) {
    // require params
    if (!req.body.phoneNumber || !req.body.password ||
        !req.body.firstName || !req.body.lastName) {
      return res.status(409).send({message: "Please provide a firstName, lastName, phoneNumber, and password."});
    }

    // format phone number
    try {
      req.body.phoneNumber = formatPhone(req.body.phoneNumber);
    } catch (e) {
      return res.status(409).send({message: "That's not a valid phone number."});
    }

    // check for existingUser
    User.userWithPhoneNumber(req.body.phoneNumber)
        .then(function (user) {
          if (user) {
            if (user.password_hash) {
              // respond with error message
              res.status(409).send({message: "Phone number is already registered."});
            } else {
              // hash password
              passwordHasher(req.body.password).hash(function (err, passwordHash) {
                // update user into db
                User.updateUser(user.id, req.body.firstName, req.body.lastName, passwordHash)
                    .then(function (results) {
                      // send back token
                      res.status(200).send({token: createToken(user.id), user: formatUser(req.body)});
                    }).catch(database.sendDBErrorResponse.bind(null, res));
              });
            }
          } else {
            // hash password
            passwordHasher(req.body.password).hash(function (err, passwordHash) {
              // insert user into db
              User.insertUser(req.body.firstName, req.body.lastName, req.body.phoneNumber, passwordHash)
                  .then(function (userId) {
                    // send back token
                    res.status(200).send({token: createToken(userId), user: formatUser(req.body)});
                  }).catch(database.sendDBErrorResponse.bind(null, res));
            });
          }
        }).catch(database.sendDBErrorResponse.bind(null, res));
  },
  login: function (req, res) {
    // require params
    if (!req.body.phoneNumber || !req.body.password) {
      return res.status(409).send({message: "Please provide a phoneNumber and password."});
    }

    // format phone number
    try {
      req.body.phoneNumber = formatPhone(req.body.phoneNumber);
    } catch (e) {
      return res.status(409).send({message: "That's not a valid phone number."});
    }

    // look up user by phone
    User.userWithPhoneNumber(req.body.phoneNumber)
        .then(function (user) {
          if (user) {
            // check password
            passwordHasher(req.body.password).verifyAgainst(user.password_hash, function (err, verified) {
              if(err) {
                  res.status(500).send({message: "Something went wrong..."});
              } else if(verified) {
                  res.status(200).send({token: createToken(user.id), user: formatUser(user)});
              } else {
                  res.status(401).send({message: "Invalid phone number and/or password."});
              }
            })
          } else {
            res.status(401).send({message: "Invalid phone number and/or password."});
          }
        }).catch(database.sendDBErrorResponse.bind(null, res));
  },
  requireAuth: function (req, res, next) {
    // check for Auth header
    if (!req.header("Authorization")) {
      return res.status(401).send({
        message: "Please make sure your request has an Authorization header."
      });
    }

    // extract payload
    const token = req.header("Authorization").split(' ')[1];
    try {
      // decode token and attach userPhoneNumber to request
      const payload = jwt.decode(token, "CHANGE_THIS!!");
      req._userId = payload.sub.userId;
      next();
    } catch (e) {
      console.log(e);
      return res.status(401).send({message: "Invalid or expired auth token."});
    }
  }
};

function createToken (userId) {
  const payload = {
    sub: {
      userId: userId
    },
    exp: moment().add(90, 'days').unix()
  };
  return jwt.encode(payload, 'CHANGE_THIS!!');
}

function formatUser (data) {
  return {
    firstName: data.first_name || data.firstName,
    lastName: data.last_name || data.lastName,
    phoneNumber: data.phone_number || data.phoneNumber
  };
}
