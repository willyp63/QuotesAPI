'use strict'

const phone = require('node-phonenumber');
const phoneUtil = phone.PhoneNumberUtil.getInstance();

module.exports = function (number) {
  const parsedNumber = phoneUtil.parse(number, 'MY');
  return phoneUtil.format(parsedNumber, phone.PhoneNumberFormat.E164);
}
