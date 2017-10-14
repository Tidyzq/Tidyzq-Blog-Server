const { defineModel } = require('../utils/modelHelper')

const Setting = defineModel('Settings', {
  fields: {
    key: {
      type: 'TEXT',
      key: true,
      nulNull: true,
    },
    value: 'TEXT',
  },
})

app.initDatabase.push(Setting.init)

module.exports = Setting
