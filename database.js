'use strict';

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

module.exports = {
  reset: function (req, res) {
    // connect to DB
    const client = new pg.Client(connectionString);
    client.connect();

    function handleDBError (err) {
      console.log(err);
      client.end();
      res.status(500).send({message: "db error..."});
    }

    function handleSuccess () {
      client.end();
      res.status(200).send({message: "db reset!"});
    }

    function dropQuoteHears () {
      return client.query("DROP TABLE quote_hears");
    }

    function dropQuotes () {
      return client.query("DROP TABLE quotes");
    }

    function dropUsers () {
      return client.query("DROP TABLE users");
    }

    function createUsers () {
      return client.query("CREATE TABLE users(" +
                           "id SERIAL PRIMARY KEY, " +
                           "created_at DATE NOT NULL, " +
                           "first_name VARCHAR(128) NOT NULL, " +
                           "last_name VARCHAR(128) NOT NULL, " +
                           "phone_number VARCHAR(16) NOT NULL, " +
                           "password_hash VARCHAR(270))"); // password hash length is 270
    }

    function uniqueIndexUserPhoneNumber () {
      return client.query("CREATE UNIQUE INDEX uniq_phone " +
                                  "ON users (phone_number)");
    }

    function createQuotes () {
      return client.query("CREATE TABLE quotes(" +
                                  "id SERIAL PRIMARY KEY, " +
                                  "created_at DATE NOT NULL, " +
                                  "said_at DATE NOT NULL, " +
                                  "text VARCHAR(200) NOT NULL, " +
                                  "said_by_user_id INTEGER REFERENCES users (id))");
    }

    function createQuoteHears () {
      return client.query("CREATE TABLE quote_hears(" +
                                  "id SERIAL PRIMARY KEY, " +
                                  "created_at DATE NOT NULL, " +
                                  "quote_id INTEGER REFERENCES quotes (id), " +
                                  "heard_by_user_id INTEGER REFERENCES users (id))");
    }

    function uniqueIndexQuoteHears () {
      return client.query("CREATE UNIQUE INDEX uniq_hear " +
                                  "ON quote_hears (quote_id, heard_by_user_id)");
    }

    function indexQuoteHearsHeardByUserId () {
      return client.query("CREATE INDEX heard_by_idx " +
                                  "ON quote_hears (heard_by_user_id)");
    }

    dropQuoteHears()
    .then(dropQuotes, handleDBError)
    .then(dropUsers, dropUsers)
    .then(createUsers, handleDBError)
    .then(uniqueIndexUserPhoneNumber, handleDBError)
    .then(createQuotes, handleDBError)
    .then(createQuoteHears, handleDBError)
    .then(uniqueIndexQuoteHears, handleDBError)
    .then(indexQuoteHearsHeardByUserId, handleDBError)
    .then(handleSuccess, handleDBError);
  }
}
