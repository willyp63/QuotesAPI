'use strict'

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

module.exports = {
  userWithPhoneNumber: function (phoneNumber) {
    const self = this;
    return new Promise(function (resolve, reject) {
      self.usersWithPhoneNumbers([phoneNumber])
          .then(function (users) {
            resolve(users[0]);
          }).catch(reject);
    });
  },
  usersWithPhoneNumbers: function (phoneNumbers) {
    return new Promise(function (resolve, reject) {
      const client = new pg.Client(connectionString);
      client.connect();

      const whereClauses = [];
      for (let i = 0; i < phoneNumbers.length; i++) {
        whereClauses.push(`phone_number = $${i + 1}`);
      }

      client.query(`SELECT * FROM users WHERE ${whereClauses.join(" OR ")}`, phoneNumbers)
            .then(function (results) {
              client.end();
              resolve(results.rows);
            }).catch(function () {
              client.end();
              reject(err);
            });
    });
  },
  insertUsersIfNotAlreadyInserted: function (usersToInsert) {
    const self = this;
    return new Promise(function(resolve, reject) {
      const phoneNumbers = usersToInsert.map(user => user.phoneNumber);
      self.usersWithPhoneNumbers(phoneNumbers)
          .then(function (users) {
            // record all phone numbers already in DB
            const phoneNumbersInDB = {};
            for (let i = 0; i < users.length; i++) {
              phoneNumbersInDB[users[i].phone_number] = true;
            }

            // insert all users not in DB
            const insertionQueries = [];
            for (let i = 0; i < usersToInsert.length; i++) {
              const user = usersToInsert[i];
              if (!phoneNumbersInDB[user.phoneNumber]) {
                insertionQueries.push(
                  self.insertUser(user.firstName, user.lastName, user.phoneNumber)
                );
              }
            }

            // wait for all queries to finish
            Promise.all(insertionQueries)
                   .then(function (results) {
                     resolve(results)
                   }).catch(function (err) {
                     reject(err);
                   });
          }).catch(function (err) {
            reject(err);
          });
    });
  },
  insertUser: function (firstName, lastName, phoneNumber, passwordHash) {
    return new Promise(function (resolve, reject) {
      const client = new pg.Client(connectionString);
      client.connect();

      client.query("INSERT INTO " +
                   "users(created_at, first_name, last_name, phone_number, password_hash) " +
                   "VALUES($1, $2, $3, $4, $5) RETURNING id",
                   [new Date(), firstName, lastName, phoneNumber, passwordHash])
            .then(function (results) {
              client.end();
              resolve(results.rows[0].id);
            }).catch(function (err) {
              client.end();
              reject(err);
            });
    });
  },
  updateUser: function (userId, firstName, lastName, passwordHash) {
    return new Promise(function (resolve, reject) {
      const client = new pg.Client(connectionString);
      client.connect();

      client.query("UPDATE users " +
                   "SET first_name = $1, last_name = $2, password_hash = $3 " +
                   "WHERE id = $4",
                   [firstName, lastName, passwordHash, userId])
            .then(function (results) {
              client.end();
              resolve(results);
            }).catch(function (err) {
              client.end();
              reject(err);
            });
    });
  }
};
