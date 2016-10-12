'use strict'

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

module.exports = {
  all: function (req, res) {
    const client = new pg.Client(connectionString);
    client.connect();

    client.query("SELECT * FROM users").then(function (results) {
      console.log(results);
      res.status(200).send(results);
    }, function (err) {
      console.log(err);
    });
  }
};
