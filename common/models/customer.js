'use strict';

var config = require('../../server/config.json');
var senderAddress = 'oliver123cullen@gmail.com';
var EmailConfig = require('../../server/EmailConfig');

module.exports = function(Customer) {
  Customer.on('resetPasswordRequest', function(info) {
    var url = 'http://' + EmailConfig.host + EmailConfig.resetPath;
    var html = 'Click <a href="' + url + '?access_token=' +
      info.accessToken.id + '">here</a> to reset your password';

    Customer.app.models.Email.send({
      to: info.email,
      from: senderAddress,
      subject: 'Password reset',
      html: html,
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });
};
