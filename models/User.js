const { defineModel } = require('../utils/modelHelper')
const bcrypt = require('bcrypt')

const defaultUser = app.get('users').default

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
    .then(() => User.findOne({ email: defaultUser.email }))
    .then(user => {
      if (!user) {
        return bcrypt.genSalt(10)
          .then(salt => bcrypt.hash(defaultUser.password, salt))
          .then(password => {
            return User.create([ _.assign({}, defaultUser, { password }) ])
          })
      }
    })
}

module.exports = User
