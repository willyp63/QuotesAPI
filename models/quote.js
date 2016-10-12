'use strict'

const database = require('../database/database.js');
const User = require('./user.js');
const QuoteHear = require('./quoteHear.js');

module.exports = {
  postQuote: function (text, saidAt, saidBy, heardBy) {
    const self = this;
    return new Promise(function (resolve, reject) {
      // get all users in saidBy and heardBy fields
      const usersInvolved = [];
      usersInvolved.push(saidBy);
      for (let i = 0; i < heardBy.length; i++) {
        usersInvolved.push(heardBy[i]);
      }

      User.insertUsersIfNotAlreadyInserted(usersInvolved)
          .then(function () {
            User.usersWithPhoneNumbers(usersInvolved.map(user => user.phoneNumber))
                .then(function (users) {
                  // map user's phone numbers to their ids
                  const userIds = {};
                  for (let i = 0; i < users.length; i++) {
                    userIds[users[i].phone_number] = users[i].id;
                  }

                  self.insertQuote(text, saidAt, userIds[saidBy.phoneNumber])
                      .then(function (quoteId) {
                        const heardByUserIds = heardBy.map(user => userIds[user.phoneNumber]);
                        QuoteHear.insertQuoteHearsWithMultipleIds(quoteId, heardByUserIds)
                                 .then(resolve).catch(reject);
                      }).catch(reject);
                }).catch(reject);
          }).catch(reject);
    });
  },
  insertQuote: function (text, saidAt, saidByUserId) {
    const client = database.newClient();
    return new Promise(function (resolve, reject) {
      client.query("INSERT INTO " +
                   "quotes(created_at, text, said_at, said_by_user_id) " +
                   "VALUES($1, $2, $3, $4) RETURNING id",
                   [new Date(), text, saidAt, saidByUserId])
            .then(function (results) {
              resolve(results.rows[0].id); // resolve to inserted row's id
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            });
    });
  }
}
