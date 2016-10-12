'use strict'

const pg = require('pg');
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/quotes';

module.exports = {
  insertQuoteHear: function (quoteId, heardByUserId) {
    return new Promise(function (resolve, reject) {
      const client = new pg.Client(connectionString);
      client.connect();

      client.query("INSERT INTO " +
                   "quote_hears(created_at, quote_id, heard_by_user_id) " +
                   "VALUES($1, $2, $3) RETURNING id",
                   [new Date(), quoteId, heardByUserId])
            .then(function (results) {
              client.end();
              resolve(results.rows[0].id);
            }).catch(function (err) {
              client.end();
              reject(err);
            });
    });
  },
  insertQuoteHears: function (quoteId, heardByUserIds) {
    const self = this;
    return new Promise(function (resolve, reject) {
      const insertionQueries = []
      for (let i = 0; i < heardByUserIds.length; i++) {
        insertionQueries.push(
          self.insertQuoteHear(quoteId, heardByUserIds[i])
        );
      }
      Promise.all(insertionQueries)
             .then(function (results) {
               resolve(results);
             }).catch(function (err) {
               reject(err);
             });
    });
  }
};
