'use strict'

const database = require('../database/database.js');

module.exports = {
  userWithPhoneNumber: function (phoneNumber) {
    const self = this;
    return new Promise(function (resolve, reject) {
      self.usersWithPhoneNumbers([phoneNumber])
          .then(function (users) {
            resolve(users[0]); // resolve to first row returned
          }).catch(reject);
    });
  },
  usersWithPhoneNumbers: function (phoneNumbers) {
    const client = database.newClient();
    return new Promise(function (resolve, reject) {
      // form where clause
      const whereClauses = [];
      for (let i = 0; i < phoneNumbers.length; i++) {
        whereClauses.push(`phone_number = $${i + 1}`);
      }

      client.query(`SELECT * FROM users WHERE ${whereClauses.join(" OR ")}`, phoneNumbers)
            .then(function (results) {
              resolve(results.rows); // resolve to rows
              client.end();
            }).catch(function () {
              reject(err);
              client.end();
            });
    });
  },
  insertUsersIfNotAlreadyInserted: function (users) {
    const self = this;
    return new Promise(function(resolve, reject) {
      self.usersWithPhoneNumbers(users.map(user => user.phoneNumber))
          .then(function (usersInDB) {
            // record all phone numbers already in DB
            const phoneNumbersInDB = {};
            for (let i = 0; i < usersInDB.length; i++) {
              phoneNumbersInDB[usersInDB[i].phone_number] = true;
            }

            // fire insertion query for all users not already in DB
            const insertionQueries = [];
            for (let i = 0; i < users.length; i++) {
              if (!phoneNumbersInDB[users[i].phoneNumber]) {
                insertionQueries.push(
                  self.insertUser(users[i].firstName, users[i].lastName, users[i].phoneNumber)
                );
              }
            }

            // wait for all to finish or one to fail
            Promise.all(insertionQueries).then(resolve).catch(reject);
          }).catch(reject);
    });
  },
  insertUser: function (firstName, lastName, phoneNumber, passwordHash) {
    const client = database.newClient();
    return new Promise(function (resolve, reject) {
      client.query("INSERT INTO " +
                   "users(created_at, first_name, last_name, phone_number, password_hash) " +
                   "VALUES($1, $2, $3, $4, $5) RETURNING id",
                   [new Date(), firstName, lastName, phoneNumber, passwordHash])
            .then(function (results) {
              resolve(results.rows[0].id); // resolve to inserted row's id
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            });
    });
  },
  updateUser: function (userId, firstName, lastName, passwordHash) {
    const client = database.newClient();
    return new Promise(function (resolve, reject) {
      client.query("UPDATE users " +
                   "SET first_name = $1, last_name = $2, password_hash = $3 " +
                   "WHERE id = $4",
                   [firstName, lastName, passwordHash, userId])
            .then(function (results) {
              resolve(results);
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            });
    });
  }
};
