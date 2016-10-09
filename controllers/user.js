const User = require('../models/user.js');

module.exports = {
  all: function (req, res) {
    User.find({}, function (err, users) {
      res.status(200).send(users);
    });
  }
};
