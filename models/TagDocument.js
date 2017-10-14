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

app.initDatabase.push(TagDocument.init)

module.exports = TagDocument
