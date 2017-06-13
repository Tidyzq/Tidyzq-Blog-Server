const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Tags_Documents', {
  fields: {
    tagId: {
      type: 'INTEGER',
      notNull: true,
      key: true,
    },
    documentId: {
      type: 'INTEGER',
      notNull: true,
      key: true,
    },
  },
})
