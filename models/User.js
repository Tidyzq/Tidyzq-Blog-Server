const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Users', {
  fields: {
    id: {
      type: 'INTEGER',
      key: true,
      autoincrement: true,
    },
    username: {
      type: 'TEXT',
      notNull: true,
    },
    password: {
      type: 'TEXT',
      notNull: true,
      hide: true,
    },
    email: {
      type: 'TEXT',
      unique: true,
      notNull: true,
    },
    avatar: {
      type: 'TEXT',
      notNull: true,
    },
  },
  indexes: [{
    name: 'Idx_Users_email',
    fields: [ 'email' ],
  }],
})
