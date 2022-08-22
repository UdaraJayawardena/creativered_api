'use strict'
const nodemailer = require('nodemailer')

module.exports = function (Complainreply) {
  Complainreply.mail = function (body, res, cb) {
    console.log('=============== mail ==============')
    const data = body

    console.log('================ data ===============')
    console.log(data)

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'creativered1925@gmail.com',
        pass: 'osnxmquzdqngwzjg'
      }
    })

    try {
      let { to, subject, message } = data

      if (message === undefined || to === undefined || subject === undefined) {
        return cb(null, {
          message: 'required-fields-missing',
          code: 400
        })
      }

      const mailOptions = {
        from: 'creativered1925@gmail.com',
        to: to,
        subject: subject,
        html: message,
        headers: { 'x-myheader': 'Email Header' }
      }

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(`Email Error => ${info.response}`)
          res.send('error')
        } else {
          console.log(`Email Response => ${info.response}`)
          res.send('ok')
        }
      })
    } catch (error) {
        console.error(error);
      return cb(null, {
        message: 'unexpected-error-occured',
        code: 500
      })
    }
  }

  Complainreply.remoteMethod('mail', {
    accepts: [
      { arg: 'data', type: 'object', http: { source: 'body' } },
      { arg: 'res', type: 'object', http: { source: 'res' } }
    ],
    http: {
      verb: 'post'
    },
    returns: [
      {
        type: 'object',
        root: true
      }
    ]
  })
}
