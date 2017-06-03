const path = require('path')
const includeAll = require('include-all')

const responses = includeAll({
  dirname: path.join(__dirname, 'responses'),
  filter: /(.+)\.js$/,
})

module.exports = function (req, res, next) {
  for (const responseName in responses) {
    res[responseName] = responses[responseName]
  }
  next()
}
