'use strict'

module.exports = function (Category) {
  Category.getProductsByCategoryId = function (categoryId, cb) {
    if (categoryId === undefined || categoryId === 0) {
      return cb(null, {
        message: 'required-fields-missing',
        code: 400
      })
    }

    try {
      Category.app.models.Product.find(
        {
          where: {
            categoryid: categoryId
          }
        },
        function (err, categories) {
          console.log('============== categories =============')

          console.log(categories)

          cb(null, {
            message: 'success',
            status: 200,
            count: categories.length,
            data: categories
          })
        }
      )
    } catch (error) {
      console.log('============ error =========')
      console.error(error)

      cb(null, { message: 'unepected-error-occured', status: 500 })
    }
  }

  Category.remoteMethod('getProductsByCategoryId', {
    accepts: [{ arg: 'categoryId', type: 'string' }],
    http: {
      verb: 'get'
    },
    returns: [
      {
        type: 'object',
        root: true
      }
    ]
  })
}
