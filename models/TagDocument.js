const initQueue = require('../services/initQueue')
const { defineModel } = require('../utils/modelHelper')

const TagDocument = defineModel('Tags_Documents', {
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

initQueue.push(TagDocument.init)

module.exports = TagDocument
