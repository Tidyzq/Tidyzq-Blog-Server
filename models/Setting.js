const initQueue = require('../services/initQueue')
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

initQueue.push(Setting.init)

module.exports = Setting
