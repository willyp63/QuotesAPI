'use strict'

const phoneFormatter = require('phone');

module.exports = function (number) {
  const formatted = phoneFormatter(number)[0];
  console.log(`got: ${formatted}`);
  if (formatted.length != 12) {
    throw new Error("Invalid phone number!");
  }
  return formatted;
}
