'use strict'

var config = require('../../server/config.json')
// var senderAddress = 'oliver123cullen@gmail.com';
var senderAddress = 'creativered1925@gmail.com'
var EmailConfig = require('../../server/EmailConfig')
const nodemailer = require('nodemailer')

module.exports = function (Customer) {
  Customer.on('resetPasswordRequest', function (info) {
    var url = 'http://' + EmailConfig.host + EmailConfig.resetPath
    var html =
      'Click <a href="' +
      url +
      '?access_token=' +
      info.accessToken.id +
      '">here</a> to reset your password'

    Customer.app.models.Email.send(
      {
        to: info.email,
        from: senderAddress,
        subject: 'Password reset',
        html: html
      },
      function (err) {
        if (err) return console.log('> error sending password reset email')
        console.log('> sending password reset email to:', info.email)
      }
    )
  })

  /* custom remote methods */

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'creativered1925@gmail.com',
      pass: 'osnxmquzdqngwzjg'
    }
  })

  Customer.afterRemote('create', function (context, user, next) {
    console.log('=============== customer after remote ===============')

    const customerData = JSON.parse(JSON.stringify(context.result))

    console.log('=============== customerData =============')
    console.log(customerData)

    const { email, firstName, lastName, username } = customerData

    // const mailOptions = {
    //   from: 'creativered1925@gmail.com',
    //   to: email,
    //   subject: 'Customer Registration',
    //   text: `Hi ${firstName} ${lastName}, your Account Successfully Created`,
    // };

    const mailOptions = {
      from: 'creativered1925@gmail.com',
      to: email,
      subject: 'Customer Registration',
      html: `<!DOCTYPE html>
      <html lang="en" xmlns="exmple.com" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="x-apple-disable-message-reformatting">
        <title></title>
        <!--[if mso]>
        <style>
          table {border-collapse:collapse;border-spacing:0;border:none;margin:0;}
          div, td {padding:0;}
          div {margin:0 !important;}
        </style>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          table, td, div, h1, p {
            font-family: Arial, sans-serif;
          }
          @media screen and (max-width: 530px) {
            .unsub {
              display: block;
              padding: 8px;
              margin-top: 14px;
              border-radius: 6px;
              background-color: #555555;
              text-decoration: none !important;
              font-weight: bold;
            }
            .col-lge {
              max-width: 100% !important;
            }
          }
          @media screen and (min-width: 531px) {
            .col-sml {
              max-width: 27% !important;
            }
            .col-lge {
              max-width: 73% !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;word-spacing:normal;background-color:#939297;">
        <div role="article" aria-roledescription="email" lang="en" style="text-size-adjust:100%;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#939297;">
          <table role="presentation" style="width:100%;border:none;border-spacing:0;">
            <tr>
              <td align="center" style="padding:0;">
                <!--[if mso]>
                <table role="presentation" align="center" style="width:600px;">
                <tr>
                <td>
                <![endif]-->
                <table role="presentation" style="width:94%;max-width:600px;border:none;border-spacing:0;text-align:left;font-family:Arial,sans-serif;font-size:16px;line-height:22px;color:#363636;">
                  <tr>
                    <td style="padding:40px 30px 30px 30px;text-align:center;font-size:24px;font-weight:bold;">
                      <a href="http://ec2-3-111-113-150.ap-south-1.compute.amazonaws.com:4200" style="text-decoration:none;"><img src="https://creativered-bucket.s3.ap-south-1.amazonaws.com/images/logo.jpg" width="165" alt="Logo" style="width:165px;max-width:80%;height:auto;border:none;text-decoration:none;color:#ffffff;"></a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:30px;background-color:#ffffff;">
                      <h1 style="margin-top:0;margin-bottom:16px;font-size:26px;line-height:32px;font-weight:bold;letter-spacing:-0.02em;">Welcome</h1>
                      <h4 style="margin:0;">Hi ${username}, your Account Successfully Created</h4>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0;font-size:24px;line-height:28px;font-weight:bold;">
                      <a href="http://ec2-3-111-113-150.ap-south-1.compute.amazonaws.com:4200" style="text-decoration:none;"><img src="https://creativered-bucket.s3.ap-south-1.amazonaws.com/images/logo_name.png" width="600" alt="" style="width:100%;height:auto;display:block;border:none;text-decoration:none;color:#363636;"></a>
                  
                      <a href="http://ec2-3-111-113-150.ap-south-1.compute.amazonaws.com:4200" style="text-decoration:none;">Client here to Login</a>
                      </td>
                  </tr>
                </table>
                <!--[if mso]>
                </td>
                </tr>
                </table>
                <![endif]-->
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>`,
      headers: { 'x-myheader': 'Email Header' }
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(`Email Error => ${info.response}`)
      } else {
        console.log(`Email Response => ${info.response}`)
      }
    })

    next()
  })
}
