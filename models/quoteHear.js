'use strict'

const database = require('../database/database.js');

module.exports = {
  insertQuoteHear: function (quoteId, heardByUserId) {
    const client = database.newClient();
    return new Promise(function (resolve, reject) {
      client.query("INSERT INTO " +
                   "quote_hears(created_at, quote_id, heard_by_user_id) " +
                   "VALUES($1, $2, $3) RETURNING id",
                   [new Date(), quoteId, heardByUserId])
            .then(function (results) {
              resolve(results.rows[0].id); // resolve to inserted row's id
              client.end();
            }).catch(function (err) {
              reject(err);
              client.end();
            });
    });
  },
  insertQuoteHearsWithMultipleIds: function (quoteId, heardByUserIds) {
    const self = this;
    return new Promise(function (resolve, reject) {
      // fire all insertion queries and save to list
      const insertionQueries = []
      for (let i = 0; i < heardByUserIds.length; i++) {
        insertionQueries.push(
          self.insertQuoteHear(quoteId, heardByUserIds[i])
        );
      }
      // wait for all to finish or one to fail
      Promise.all(insertionQueries).then(resolve).catch(reject);
    });
  }
};
