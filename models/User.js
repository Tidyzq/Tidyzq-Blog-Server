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

User.init = async function () {
  await defaultInit()
  if (!await User.findOne({ email: defaultUser.email })) {
    const salt = await bcrypt.genSalt(10)
    const password = await bcrypt.hash(defaultUser.password, salt)
    return await User.create([ _.assign({}, defaultUser, { password }) ])
  }
}

app.initDatabase.push(User.init)

module.exports = User
