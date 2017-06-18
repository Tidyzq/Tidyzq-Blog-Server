const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Tags_Documents', {
  fields: {
    tagId: {
      type: 'INTEGER',
      notNull: true,
      key: true,
      foreign: 'Tags.id',
    },
    documentId: {
      type: 'INTEGER',
      notNull: true,
      key: true,
      foreign: 'Documents.id',
    },
  },
})
