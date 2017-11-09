const { bodyLimit } = require('../configs')

module.exports = require('body-parser').json({
  limit: bodyLimit,
})
