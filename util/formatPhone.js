'use strict'

const phoneFormatter = require('phone-formatter');

module.exports = function (number) {
  const formatted = phoneFormatter.format(number, "NNNNNNNNNN");
  console.log(`got: ${formatted}`);
  if (formatted.length != 10) {
    throw new Error("Invalid phone number!");
  }
  return formatted;
}
