const initQueue = require('../services/initQueue')
const { defineModel } = require('../utils/modelHelper')

const Tag = defineModel('Tags', {
  fields: {
    id: {
      type: 'INTEGER',
      key: true,
      autoincrement: true,
    },
    name: {
      type: 'TEXT',
      notNull: true,
    },
    url: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
  },
  indexes: [{
    name: 'Idx_Tags_url',
    fields: [ 'url' ],
  }],
})

initQueue.push(Tag.init)

module.exports = Tag
