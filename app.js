'use strict'

const express = require('express');
const app = express();

const authCtrl = require('./controllers/auth.js');
const userCtrl = require('./controllers/user.js');
const quoteCtrl = require('./controllers/quote.js');

const User = require('./models/user.js');

// Connect to DB
const mongoose = require('mongoose');
if (!process.env.MONGOLAB_URI) {
  console.log('ENV varible MONGOLAB_URI needs to be set!!');
  process.exit(1);
}
mongoose.connect(process.env.MONGOLAB_URI);

// Parse Response Body
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// Set Response Headers
const headers = require('./middleware/headers.js');
app.use(headers);

// User Auth
app.post('/auth/register', authCtrl.register);
app.post('/auth/login', authCtrl.login);
app.get('/auth/refresh', authCtrl.requireAuth, authCtrl.refreshToken);

// Quotes
app.get('/quotes', authCtrl.requireAuth, quoteCtrl.all); // remove
app.get('/quotes/me', authCtrl.requireAuth, quoteCtrl.mine);
app.get('/quotes/me/said', authCtrl.requireAuth, quoteCtrl.mySaid);
app.get('/quotes/me/heard', authCtrl.requireAuth, quoteCtrl.myHeard);
app.post('/quotes', authCtrl.requireAuth, quoteCtrl.post);

// Users
app.get('/users', authCtrl.requireAuth, userCtrl.all); // remove

// Listen on ENV_PORT or 8080
const port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log(`listening on *:${port}`);
});
