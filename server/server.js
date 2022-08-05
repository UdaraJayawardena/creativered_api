'use strict';

// Passport
const express = require('express');
const authRoutes = require('../routes/auth-routes');
const paypal = require('paypal-rest-sdk');
const appforexpress = express();
// stripe
const keys = require('../config/stripekey');
const stripe = require('stripe')(keys.stripeSecretKey);
const bodyparser = require('body-parser');

// paypal

// appforexpress.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type');
//   next();
// });

appforexpress.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

paypal.configure({
  'mode': 'sandbox',
  'client_id': 'AdKvp8_NRuFmnNvipbQsjuLNf2pAF7vCXkw3j' +
    'ZU50SIdoCuBf6O06UZi0UIpe5ZOxCGWNAOdSR_JKhz2',
  'client_secret': 'EI_l6VsubIvMKCkLtIHfzJtnw5ptRwrUdA' +
    'YccbKA-GujMSpHYFjgFwJ3wRXZJi5l6rXiKtnjjkP9uzc3',
});

let rederecturl;

// start payment process
appforexpress.post('/buy', (req, res) => {
  console.log('ok paypal');

  // create payment object
  var payment = {
    'intent': 'authorize',
    'payer': {
      'payment_method': 'paypal',
    },
    'redirect_urls': {
      'return_url': 'http://192.168.8.102:8000/success',
      'cancel_url': 'http://192.168.8.102:8000/err',
    },
    'transactions': [{
      'amount': {
        'total': 0.05,
        'currency': 'USD',
      },
      'description': ' creative red ',
    }],
  };

  // call the create Pay method
  createPay(payment)
    .then((transaction) => {
      var id = transaction.id;
      var links = transaction.links;
      var counter = links.length;
      while (counter--) {
        if (links[counter].method == 'REDIRECT') {
          // redirect to paypal where user approves the transaction
          //  return res.redirect(links[counter].href);
          var linkdata = {'url': links[counter].href};
          JSON.stringify(linkdata);
          res.send(linkdata);
        }
      }
    })
    .catch((err) => {
      console.log('error hasika');
      console.log(err);
      let errdata = err;
      JSON.stringify(errdata);
      res.send(errdata);
    });
});

// success page
appforexpress.get('/success', (req, res) => {
  console.log('not error');
  let sucesmess = res;
  let answer = res.json(sucesmess);
  console.log('hasika ok' + answer);
  res.send(res);
});

// error page
appforexpress.get('/err', (req, res) => {
  console.log(req.query);
  res.send(res);
});

const createPay = (payment) => {
  return new Promise((resolve, reject) => {
    paypal.payment.create(payment, function(err, payment) {
      if (err) {
        console.log('error');
        reject(err);
      } else {
        resolve(payment);
      }
    });
  });
};

// set up body parser
appforexpress.use(bodyparser.json());
appforexpress.use(bodyparser.urlencoded({extended: false}));

// charge route

appforexpress.post('/charge', function(req, res) {
  if (req.body.type === 'stripe') {
    let sampleamount = req.body.amount * 100;
    let amount = sampleamount; // 500 cents means $5
    console.log(req.body);
    // create a customer
    stripe.customers.create({
      email: req.body.stripeEmail, // customer email, which user need to enter while making payment
      source: req.body.stripeToken, // token for the given card
    })
      .then(customer =>
        stripe.charges.create({ // charge the customer
          amount,
          description: 'Creative Red Charge',
          currency: 'USD',
          customer: customer.id,
        }))
      .then(charge => res.send(charge)); // render the charge view: views/charge.pug
  } else {
    console.log('ok');
  }
});
// Set up view engine
appforexpress.set('view engine', 'ejs');

// set up routes
appforexpress.use('/auth', authRoutes);

// Creating Routes
appforexpress.get('/', (req, res) => {
  res.render('index', {
    stripePublishableKey: keys.stripePublishableKey,
  });
});

appforexpress.get('/success', (req, res) => {
  res.render('success');
});

appforexpress.listen(8000, () => {
  console.log('Authentication App listening to the port 8000');
});

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
const path = require('path');
const nodeMailer = require('nodemailer');
var bodyParser = require('body-parser');
var appformail = express();
var port = 8050;
appformail.listen(port, function(req, res) {
  // console.log('Server is running at port: ', port);
});

appformail.set('view engine', 'ejs');
appformail.use(express.static('public'));

appformail.get('/mail', function(req, res) {
  res.render('mailer');
});

appformail.use(bodyParser.urlencoded({extended: true}));
appformail.use(bodyParser.json());

const password = require('../config/password');
appformail.post('/send-email', function(req, res) {
  let transporter = nodeMailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: password.user,
      pass: password.pass,
    },
  });
  let mailOptions = {
    from: '"Hasika Sandarwan" <hasikasandaruwan.mgtuk@gmail.com>', // sender address
    to: req.body.to, // list of receivers
    subject: req.body.subject, // Subject line
    text: req.body.body, // plain text body
    html: '<b>NodeJS Email Tutorial</b>', // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
    res.render('index');
  });
});

// sendmail

appformail.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

appformail.post('/mail', function(req, resp) {
  var transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hasikasandaruwan.mgtuk@gmail.com',
      pass: '19951016',
    },
  });

  const mailOptions = {
    from: 'creativered@gmail.com', // sender address
    to: req.body.to, // list of receivers
    subject: req.body.subject, // Subject line
    html: req.body.message, // plain text body
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err)
      resp.send(err);
    else
      resp.send(info);
  });
});

