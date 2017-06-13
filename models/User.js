const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Users', {
  fields: {
    id: {
      type: 'INTEGER',
      notNull: true,
      key: true,
      autoincrement: true,
    },
    username: {
      type: 'TEXT',
      default: '""',
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
      default: '""',
    },
  },
  indexes: [{
    name: 'Idx_Users_email',
    fields: [ 'email' ],
  }],
})
