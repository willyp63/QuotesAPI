'use strict'

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

const User = require('./user.js');
const QuoteHear = require('./QuoteHear.js');

module.exports = {
  postQuote: function (text, saidAt, saidBy, heardBy) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const usersInvolved = [];
      usersInvolved.push(saidBy);
      for (let i = 0; i < heardBy.length; i++) {
        usersInvolved.push(heardBy[i]);
      }
      // insert all users that are not in database
      User.insertUsersIfNotAlreadyInserted(usersInvolved)
          .then(function () {
            const phoneNumbersInvolved = usersInvolved.map(user => user.phoneNumber);
            User.usersWithPhoneNumbers(phoneNumbersInvolved)
                .then(function (users) {
                  // map user phone numbers to ids
                  const userIds = {};
                  for (let i = 0; i < users.length; i++) {
                    userIds[users[i].phone_number] = users[i].id;
                  }

                  // insert quote
                  self.insertQuote(text, saidAt, userIds[saidBy.phoneNumber])
                      .then(function (quoteId) {
                        // insert quote hears
                        const heardByUserIds = heardBy.map(user => userIds[user.phoneNumber]);
                        QuoteHear.insertQuoteHears(quoteId, heardByUserIds)
                                 .then(resolve).catch(reject);
                      }).catch(reject);
                }).catch(reject);
          }).catch(reject);
    });
  },
  insertQuote: function (text, saidAt, saidByUserId) {
    return new Promise(function (resolve, reject) {
      const client = new pg.Client(connectionString);
      client.connect();

      client.query("INSERT INTO " +
                   "quotes(created_at, text, said_at, said_by_user_id) " +
                   "VALUES($1, $2, $3, $4) RETURNING id",
                   [new Date(), text, saidAt, saidByUserId])
            .then(function (results) {
              client.end();
              resolve(results.rows[0].id);
            }).catch(function (err) {
              client.end();
              reject(err);
            });
    });
  }
}
