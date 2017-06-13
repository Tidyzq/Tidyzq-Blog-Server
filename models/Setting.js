const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Settings', {
  fields: {
    key: {
      type: 'TEXT',
      key: true,
      nulNull: true,
    },
    value: 'TEXT',
  },
})
