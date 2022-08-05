/* eslint-disable no-multiple-empty-lines,strict,comma-dangle */
// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: loopback-example-user-management
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

// eslint-disable-next-line strict
var dsConfig = require('../datasources.json');
var path = require('path');

module.exports = function(app) {
  var User = app.models.user;

  // send an email with instructions to reset an existing user's password
  app.post('/request-password-reset', function(req, res, next) {
    User.resetPassword({
      email: req.body.email,
    }, function(err) {
      if (err) return res.status(401).send(err);

      res.render('response', {
        title: 'Password reset requested',
        content: 'Check your email for further instructions',
        redirectTo: '/lockside/',
        redirectToLinkText: 'Log in',
      });
    });
  });

  // show password reset form
  app.get('/reset-password', function(req, res, next) {
    if (!req.accessToken) return res.sendStatus(401);
    res.render('password-reset', {
      redirectUrl: '/directReset?access_token=' +
        req.accessToken.id,
    });
  });
};
