'use strict';

const express = require('express');
const app = express();

const database = require('./database/database.js');
const authCtrl = require('./controllers/auth.js');
const quoteCtrl = require('./controllers/quote.js');

// Parse Response Body
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Set Response Headers
const headers = require('./middleware/headers.js');
app.use(headers);

// !!!DANGEROUS ROUTE!!! (remove when in production)
app.post('/db/reset', database.reset);

// User Auth
app.post('/auth/register', authCtrl.register);
app.post('/auth/login', authCtrl.login);

// Quotes
// app.get('/quotes', authCtrl.requireAuth, quoteCtrl.all); // remove
// app.get('/quotes/me', quoteCtrl.mine);
// app.get('/quotes/me/said', authCtrl.requireAuth, quoteCtrl.mySaid);
// app.get('/quotes/me/heard', authCtrl.requireAuth, quoteCtrl.myHeard);
app.post('/quotes', authCtrl.requireAuth, quoteCtrl.post);

// Listen on ENV_PORT or 8080
const port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log(`listening on *:${port}`);
});
