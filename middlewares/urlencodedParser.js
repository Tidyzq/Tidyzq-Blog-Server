module.exports = require('body-parser').urlencoded({
  extended: true,
  limit: app.get('bodyLimit'),
})
