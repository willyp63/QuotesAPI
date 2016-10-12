'use strict'

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

const jwt = require('jwt-simple');
const moment = require('moment');
const passwordHasher = require('password-hash-and-salt');
const formatPhone = require('../util/formatPhone.js');

module.exports = {
  register: function (req, res) {
    // require params
    if (!req.body.phoneNumber || !req.body.password ||
        !req.body.firstName || !req.body.lastName) {
      return res.status(409).send({message: "Please provide a firstName, lastName, phoneNumber, and password."});
    }

    // connect to DB
    const client = new pg.Client(connectionString);
    client.connect();
    function handleDBError (err) {
      console.log(err);
      client.end();
      res.status(500).send({message: "db error..."});
    }

    // check for existingUser
    const phoneNumber = formatPhone(req.body.phoneNumber);
    client.query("SELECT * FROM users WHERE phone_number = $1", [phoneNumber])
          .then(function (results) {
            if (results.rows.length) {
              client.end();
              // respond with error message
              res.status(409).send({message: "Phone number is already registered."});
            } else {
              // insert user into db
              const createdAt = new Date();
              // hash password
              passwordHasher(req.body.password).hash(function (err, passwordHash) {
                client.query("INSERT INTO " +
                             "users(created_at, first_name, last_name, phone_number, password_hash) " +
                             "VALUES($1, $2, $3, $4, $5)",
                             [createdAt, req.body.firstName, req.body.lastName, phoneNumber, passwordHash])
                      .then(function (results) {
                        client.end();
                        // send back token
                        res.status(200).send({token: createToken(phoneNumber)});
                      }).catch(handleDBError);
              });
            }
          }).catch(handleDBError);
  },
  requireAuth: function (req, res, next) {
    // TODO
    next();
  }
};

function createToken (phoneNumber) {
  const payload = {
    sub: {
      userPhoneNumber: phoneNumber
    },
    exp: moment().add(90, 'days').unix()
  };
  return jwt.encode(payload, 'CHANGE_THIS!!');
}
