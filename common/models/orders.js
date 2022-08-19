'use strict'

const moment = require('moment-timezone')
const async = require('async')

const dbConnection = require('../../server/mysql').pool
const mysql = require('../../server/mysql').mysql
const l = require('loopback')

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
      customerId,
      itemDetails
    } = data

    if (
      Object.entries(billingAddressDetails).length === 0 ||
      Object.entries(shippingAddressDetails).length === 0 ||
      status === undefined ||
      paymentMethod === undefined ||
      paymentId === undefined ||
      trackingId === undefined ||
      customerId === undefined ||
      itemDetails.length === 0
    ) {
      return cb(null, {
        message: 'required-fields-missing',
        code: 400
      })
    }

    const orderDate = moment.utc().format('YYYY-MM-DD HH:mm:ss')
    const orderTime = moment().format('hh:mm:ss')

    console.log('orderDate => ', orderDate, 'orderTime =>', orderTime)

    const verifyCustomer = () => {
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
          fetchAllItems()
        }
      )
    }

    const fetchAllItems = () => {
      Orders.app.models.Item.find({}, function (err, items) {
        console.log('============== items =============')

        if (!items) {
          return cb(null, { message: 'fetch-items-failed' })
        }
        console.log('items =>', items.length)

        startTransaction(items)
      })
    }

    verifyCustomer()

    const startTransaction = totalItems => {
      const updatedItemsArr = []

      async.eachOf(totalItems, (item, index, cb_update_items) => {
        const updatedItemObj = JSON.parse(JSON.stringify(item))

        updatedItemsArr.push(updatedItemObj)

        cb_update_items()
      })

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

      console.log('=============== updatedItemsArr.length ================')
      console.log(updatedItemsArr.length)

      let updatedFilterItemObjArr = []

      async.eachOf(
        itemDetails,
        (item, index, cb_filter_items) => {
          const itemFilter = updatedItemsArr.filter(
            result => result.id === item.itemid
          )

          // console.log('result.id =>', result.id, 'item.itemid =>', item.itemid)
          // console.log('condition =>', result.id === item.itemid)

          const itemObj = itemFilter[0]

          console.log('============= itemObj =============')
          console.log(itemObj)

          console.log(itemObj.qtyOnHand, item.qty)

          const updatedItemObj = {
            id: item.itemid,
            qtyOnHand: itemObj.qtyOnHand - item.qty
          }
          updatedFilterItemObjArr.push(updatedItemObj)

          cb_filter_items()
        },
        err => {}
      )

      console.log('================ updatedFilterItemObjArr ============')
      console.log(updatedFilterItemObjArr)

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
                addOrderDetailsRecord()
              }
            })
          }

          const addOrderDetailsRecord = () => {
            console.log('============ addOrderDetailsRecord ===============')
            let orderDetailArr = []
            let orderid = orderId
            async.eachOf(
              itemDetails,
              async (item, index, cb_order_details) => {
                orderDetailArr.push([
                  item.qty,
                  item.color,
                  item.price,
                  item.itemid,
                  orderid
                ])
                cb_order_details()
              },
              err => {}
            )
            let orderDetailsQuery = `INSERT INTO OrderDetail (qty, color, price, itemid, orderid) VALUES ?`
            console.log('================ orderDetailArr ===============')
            console.log(orderDetailArr)
            con.query(
              orderDetailsQuery,
              [orderDetailArr],
              (error, orderDetailResult) => {
                if (error) {
                  console.error(error)
                  return rollBack('order-details-save-error')
                } else {
                  console.log(
                    '================== orderDetailResult =============='
                  )
                  updateItemsRecord()
                }
              }
            )
          }

          const updateItemsRecord = () => {
            console.log('============ updateItemsRecord ===============')

            let queries = ''

            updatedFilterItemObjArr.forEach(function (item) {
              queries += `UPDATE Item SET qtyOnHand = '${item.qtyOnHand}' WHERE id = ${item.id} ; `
            })

            console.log('queries =>', queries)

            con.query(queries, (error, itemResult) => {
              if (error) {
                console.error(error)
                return rollBack('item-update-record-error')
              } else {
                console.log('================== itemResult ==============')
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
                  message: 'order-successfully-placed',
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
