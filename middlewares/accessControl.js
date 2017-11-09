const accessControlConfig = require('../configs').http.accessControl

module.exports = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', accessControlConfig.allowOrigin)
  res.header('Access-Control-Allow-Headers', accessControlConfig.allowHeaders)
  res.header('Access-Control-Allow-Methods', accessControlConfig.allowMethods)
  if (req.method === 'OPTIONS') {
    res.ok()
  } else {
    next()
  }
}
