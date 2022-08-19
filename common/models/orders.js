'use strict'

const dbConnection = require('../../server/mysql').pool
// const moment = require('moment');
const moment = require('moment-timezone')

module.exports = function (Orders) {
  Orders.completePurchase = function (body, res, cb) {
    console.log('=============== completePurchase ==============')
    const data = body

    console.log('================ data ===============')
    console.log(data)

    let {
      billingAddressDetails,
      shippingAddressDetails,
      status,
      paymentMethod,
      paymentId,
      trackingId,
      customerId
    } = data

    if (
      Object.entries(billingAddressDetails).length === 0 ||
      Object.entries(shippingAddressDetails).length === 0 ||
      status === undefined ||
      paymentMethod === undefined ||
      paymentId === undefined ||
      trackingId === undefined ||
      customerId === undefined
    ) {
      return cb(null, {
        message: 'required-fields-missing',
        code: 400
      })
    }

    const orderDate = moment.utc().format('YYYY-MM-DD HH:mm:ss')
    const orderTime = moment().format('hh:mm:ss')

    console.log('orderDate => ', orderDate, 'orderTime =>', orderTime);

    Orders.app.models.Customer.findOne(
      {
        where: {
          id: customerId
        }
      },
      function (err, customer) {
        console.log('============== customer =============')

        if (!customer) {
          return cb(null, { message: "customer-doesn't-exists" })
        }

        startTransaction()
      }
    )

    let orderObj = {
      orderDate,
      orderTime,
      status,
      paymentMethod,
      paymentId,
      trackingId,
      customerOrderId: customerId,
      billingid: 0,
      shippingid: 0
    }

    let billingAddressObj = billingAddressDetails
    billingAddressObj.customerBillingId = customerId

    let shippingAddressObj = shippingAddressDetails
    shippingAddressObj.customerShippingId = customerId

    const startTransaction = () => {
      dbConnection.getConnection((err, con) => {
        con.beginTransaction(err => {
          if (err) throw err

          let billingAddressArr = []
          let shippingAddresArr = []

          billingAddressArr.push([
            billingAddressObj.firstName,
            billingAddressObj.lastName,
            billingAddressObj.addressOne,
            billingAddressObj.addressTwo,
            billingAddressObj.city,
            billingAddressObj.country,
            billingAddressObj.postalCode,
            billingAddressObj.status,
            billingAddressObj.customerBillingId
          ])

          shippingAddresArr.push([
            shippingAddressObj.firstName,
            shippingAddressObj.lastName,
            shippingAddressObj.addressOne,
            shippingAddressObj.addressTwo,
            shippingAddressObj.city,
            shippingAddressObj.country,
            shippingAddressObj.postalCode,
            shippingAddressObj.status,
            shippingAddressObj.customerShippingId
          ])

          let orderId = 0

          const rollBack = error => {
            console.log('============ rollBack ===============')
            console.error(error)

            con.rollback(() => {
              con.release()
              cb(null, { message: 'transaction-rollback-failed' })
              console.error(error)
            })
          }

          const addBillingAddressRecord = () => {
            console.log('============ updateBillingAddress ===============')

            let billingAddressQuery = `INSERT INTO BillingAddress (firstName, lastName, addressOne, addressTwo, city, country, postalCode, status, customerBillingId) VALUES ?`

            console.log(billingAddressArr)

            con.query(
              billingAddressQuery,
              [billingAddressArr],
              (error, billingAddressResult) => {
                if (error) {
                  console.error(error)
                  return rollBack('billing-address-save-error')
                } else {
                  console.log(
                    '================== billingAddressResult =============='
                  )
                  orderObj.billingid = billingAddressResult.insertId
                  addShippingAddressRecord()
                }
              }
            )
          }

          const addShippingAddressRecord = () => {
            console.log('============ updateShippingAddress ===============')

            let shippingAddressQuery = `INSERT INTO ShippingAddress (firstName, lastName, addressOne, addressTwo, city, country, postalCode, status, customerShippingId) VALUES ?`

            console.log(billingAddressArr)

            con.query(
              shippingAddressQuery,
              [shippingAddresArr],
              (err, shippingAddressResult) => {
                if (err) {
                  return rollBack('shipping-address-save-error')
                } else {
                  console.log(
                    '================== shippingAddressResult =============='
                  )
                  orderObj.shippingid = shippingAddressResult.insertId
                  addOrderRecord()
                }
              }
            )
          }

          const addOrderRecord = () => {
            console.log('============ addOrderRecord ===============')
            let orderArr = []

            orderArr.push([
              orderObj.orderDate,
              orderObj.orderTime,
              orderObj.status,
              orderObj.paymentMethod,
              orderObj.paymentId,
              orderObj.trackingId,
              orderObj.customerOrderId,
              orderObj.billingid,
              orderObj.shippingid
            ])

            let orderQuery = `INSERT INTO Orders (orderDate, orderTime, status, paymentMethod, paymentId, trackingId, customerOrderId, billingid, shippingid) VALUES ?`

            console.log(orderArr)

            con.query(orderQuery, [orderArr], (error, orderResult) => {
              if (error) {
                console.error(error)
                return rollBack('order-save-error')
              } else {
                console.log('================== orderResult ==============')
                orderId = orderResult.insertId
                commit()
              }
            })
          }

          const commit = () => {
            con.commit(err => {
              if (err) {
                rollBack('final-commit-error')
              } else {
                console.log('transaction complete...')
                con.release()

                return cb(null, {
                  message: 'order-successfully-completed',
                  status: 200,
                  data: { orderId }
                })
              }
            })
          }

          addBillingAddressRecord()
        })
      })
    }
  }

  Orders.remoteMethod('completePurchase', {
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
