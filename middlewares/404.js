const log = require('../services/log')

module.exports = function (req, res) {
  log.verbose('404 middleware ::', req.originalUrl, 'not matching any route')
  res.notFound()
}
