'use strict'

const database = require('../database/database.js');
const User = require('./user.js');
const QuoteHear = require('./quoteHear.js');

module.exports = {
  myAggregatedQuotes: function (userId) {
    return new Promise(function(resolve, reject) {
      const client = database.newClient();
      client.query("SELECT quotes.*, " +
                   "said_by_users.first_name AS said_by_first_name, " +
                   "said_by_users.last_name AS said_by_last_name, " +
                   "said_by_users.phone_number AS said_by_phone_number, " +
                   "heard_by_users.first_name AS heard_by_first_name, " +
                   "heard_by_users.last_name AS heard_by_last_name, " +
                   "heard_by_users.phone_number AS heard_by_phone_number " +
                   "FROM ( " +
                      "SELECT quotes.* " +
                      "FROM quotes " +
                      "LEFT JOIN quote_hears " + // a quote no one heard??
                      "ON quote_hears.quote_id = quotes.id " +
                      "WHERE quotes.said_by_user_id = $1 " +
                         "OR quote_hears.heard_by_user_id = $1 " +
                      "GROUP BY quotes.id " +
                   ") AS quotes " +
                   "JOIN users AS said_by_users " +
                   "ON quotes.said_by_user_id = said_by_users.id " +
                   "LEFT JOIN quote_hears " + // a quote no one heard??
                   "ON quote_hears.quote_id = quotes.id " +
                   "LEFT JOIN users AS heard_by_users " +
                   "ON quote_hears.heard_by_user_id = heard_by_users.id " +
                   "ORDER BY quotes.id", [userId])
            .then(function (results) {
              const quotes = aggregateHeardByUsers(results.rows);
              resolve(quotes);
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            })
    });
  },
  mySaidAggregatedQuotes: function (userId) {
    return new Promise(function(resolve, reject) {
      const client = database.newClient();
      client.query("SELECT quotes.*, " +
                   "said_by_users.first_name AS said_by_first_name, " +
                   "said_by_users.last_name AS said_by_last_name, " +
                   "said_by_users.phone_number AS said_by_phone_number, " +
                   "heard_by_users.first_name AS heard_by_first_name, " +
                   "heard_by_users.last_name AS heard_by_last_name, " +
                   "heard_by_users.phone_number AS heard_by_phone_number " +
                   "FROM ( " +
                      "SELECT * " +
                      "FROM quotes " +
                      "WHERE quotes.said_by_user_id = $1 " +
                   ") AS quotes " +
                   "JOIN users AS said_by_users " +
                   "ON quotes.said_by_user_id = said_by_users.id " +
                   "LEFT JOIN quote_hears " + // a quote no one heard??
                   "ON quote_hears.quote_id = quotes.id " +
                   "LEFT JOIN users AS heard_by_users " +
                   "ON quote_hears.heard_by_user_id = heard_by_users.id " +
                   "ORDER BY quotes.id", [userId])
            .then(function (results) {
              const quotes = aggregateHeardByUsers(results.rows);
              resolve(quotes);
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            })
    });
  },
  myHeardAggregatedQuotes: function (userId) {
    return new Promise(function(resolve, reject) {
      const client = database.newClient();
      client.query("SELECT quotes.*, " +
                   "said_by_users.first_name AS said_by_first_name, " +
                   "said_by_users.last_name AS said_by_last_name, " +
                   "said_by_users.phone_number AS said_by_phone_number, " +
                   "heard_by_users.first_name AS heard_by_first_name, " +
                   "heard_by_users.last_name AS heard_by_last_name, " +
                   "heard_by_users.phone_number AS heard_by_phone_number " +
                   "FROM ( " +
                      "SELECT quotes.* " +
                      "FROM quotes " +
                      "LEFT JOIN quote_hears " + // a quote no one heard??
                      "ON quote_hears.quote_id = quotes.id " +
                      "WHERE quote_hears.heard_by_user_id = $1 " +
                      "GROUP BY quotes.id " +
                   ") AS quotes " +
                   "JOIN users AS said_by_users " +
                   "ON quotes.said_by_user_id = said_by_users.id " +
                   "LEFT JOIN quote_hears " + // a quote no one heard??
                   "ON quote_hears.quote_id = quotes.id " +
                   "LEFT JOIN users AS heard_by_users " +
                   "ON quote_hears.heard_by_user_id = heard_by_users.id " +
                   "ORDER BY quotes.id", [userId])
            .then(function (results) {
              const quotes = aggregateHeardByUsers(results.rows);
              resolve(quotes);
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            })
    });
  },
  insertQuoteWithRawFormData: function (text, saidAt, saidBy, heardBy) {
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

function groupRows (rows) {
  let groups = [], currGroup = [];
  for (let i = 0; i < rows.length; i++) {
    currGroup.push(rows[i]);
    if (i === rows.length - 1 || rows[i].id !== rows[i + 1].id) {
      groups.push(currGroup);
      currGroup = [];
    }
  }
  return groups;
}

function aggregateHeardByUsers (quotes) {
  const quoteGroups = groupRows(quotes);
  const aggregatedQuotes = [];
  for (let i = 0; i < quoteGroups.length; i++) {
    const quoteGroup = quoteGroups[i];
    const heardByUsers = [];
    for (var k = 0; k < quoteGroup.length; k++) {
      heardByUsers.push({
        firstName: quoteGroup[k].heard_by_first_name,
        lastName: quoteGroup[k].heard_by_last_name,
        phoneNumber: quoteGroup[k].heard_by_phone_number
      });
    }
    aggregatedQuotes.push({
      text: quoteGroup[0].text,
      saidAt: quoteGroup[0].said_at,
      saidBy: {
        firstName: quoteGroup[0].said_by_first_name,
        lastName: quoteGroup[0].said_by_last_name,
        phoneNumber: quoteGroup[0].said_by_phone_number
      },
      heardBy: heardByUsers
    });
  }
  return aggregatedQuotes;
}
