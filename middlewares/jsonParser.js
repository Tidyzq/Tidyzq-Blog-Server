module.exports = require('body-parser').json({
  limit: app.get('bodyLimit'),
})
