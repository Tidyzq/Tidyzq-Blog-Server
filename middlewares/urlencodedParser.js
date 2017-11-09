const { bodyLimit } = require('../configs')

module.exports = require('body-parser').urlencoded({
  extended: true,
  limit: bodyLimit,
})
