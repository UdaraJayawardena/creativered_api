'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const keysfromjs = require('./keys');

passport.use(
  new GoogleStrategy({
    // option for strategies
    callbackURL: '/auth/google/redirect',
    clientID: keysfromjs.google.clientID,
    clientSecret: keysfromjs.google.clientSecret,
  }, (accessToken, refreshToken, profile, done) => {
    // passport callback function Fired
  })
);
