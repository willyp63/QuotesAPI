'use strict'

const phoneFormatter = require('phone');

module.exports = function (number) {
  const formatted = phoneFormatter(number)[0];
  if (formatted.length != 12) {
    throw new Error("That's not a real phone number!");
  }
  return formatted;
}
