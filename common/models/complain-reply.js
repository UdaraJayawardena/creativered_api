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

    // {
    //     "comDate": "2022-08-21",
    //     "comTime": "01:37:21",
    //     "message": "item was damaged",
    //     "status": "true",
    //     "complainTypeID": 1,
    //     "id": 1,
    //     "complainOrderId": 1
    //   }

    try {
      let { message } = data

      if (message === undefined) {
        return cb(null, {
          message: 'required-fields-missing',
          code: 400
        })
      }

      const mailOptions = {
        from: 'creativered1925@gmail.com',
        to: "nuwannadeera1997@gmail.com",
        subject: 'Complain Reply Message',
        text: `${message} #Issue Resolved By Admin`
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
