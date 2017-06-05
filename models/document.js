const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Documents', {
  fields: {
    id: {
      type: 'INTEGER',
      notNull: true,
      key: true,
      autoincrement: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    url: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    type: {
      type: 'TEXT',
      notNull: true,
      default: 'draft',
    },
    markdown: {
      type: 'TEXT',
      notNull: true,
    },
    modifiedAt: {
      type: 'DATETIME',
      notNull: true,
    },
    createdAt: {
      type: 'DATETIME',
      notNull: true,
    },
    author: {
      type: 'INTEGER',
      notNull: true,
      foreign: 'Users.id',
    },
  },
  indexes: [{
    name: 'Idx_Documents_url_type',
    fields: [ 'url', 'type' ],
  }, {
    name: 'Idx_Documents_author_type',
    fields: [ 'author', 'type' ],
  }],
})