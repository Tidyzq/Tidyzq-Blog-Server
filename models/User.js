const { defineModel } = require('../utils/modelHelper')
const bcrypt = require('bcrypt')

const User = defineModel('Users', {
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

const defaultInit = User.init

User.init = function () {
  return defaultInit()
    .then(() => bcrypt.genSalt(10))
    .then(salt => bcrypt.hash('administrator', salt))
    .then(password => {
      const user = new User({
        username: 'admin',
        password,
        email: 'admin@admin.com',
      })
      return user.save()
    })
}

module.exports = User
