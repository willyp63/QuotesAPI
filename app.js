'use strict';

const express = require('express');
const app = express();

const database = require('./database.js');
const authCtrl = require('./controllers/auth.js');
const userCtrl = require('./controllers/user.js');
//const quoteCtrl = require('./controllers/quote.js');

// Parse Response Body
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Set Response Headers
const headers = require('./middleware/headers.js');
app.use(headers);

app.post('/db/reset', database.reset);

// User Auth
app.post('/auth/register', authCtrl.register);
// app.post('/auth/login', authCtrl.login);
// app.post('/auth/logout', authCtrl.requireAuth, authCtrl.logout);
// app.post('/auth/refresh', authCtrl.requireAuth, authCtrl.refresh);
//
// // Quotes
// app.get('/quotes', authCtrl.requireAuth, quoteCtrl.all); // remove
// app.get('/quotes/me', quoteCtrl.mine);
// app.get('/quotes/me/said', authCtrl.requireAuth, quoteCtrl.mySaid);
// app.get('/quotes/me/heard', authCtrl.requireAuth, quoteCtrl.myHeard);
// app.post('/quotes', authCtrl.requireAuth, quoteCtrl.post);

// Users
app.get('/users', authCtrl.requireAuth, userCtrl.all); // remove

// Listen on ENV_PORT or 8080
const port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log(`listening on *:${port}`);
});
