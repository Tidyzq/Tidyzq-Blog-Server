const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const jwtStrategy = require('passport-jwt').Strategy
const bcrypt = require('bcrypt')

const tokenConfig = require('../configs').token
const jwtFromRequest = require('../services/token').extractTokenFromHeader
const User = require('../models/User')

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findOne({ id })
    done(null, user)
  } catch (err) {
    done(err)
  }
})

passport.use(new localStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email })

      if (!user) {
      // 检查用户是否存在
        return done(null, false, new Error('No Such User.'))
      }
      if (!await bcrypt.compare(password, user.password)) {
      // 检查用户密码是否正确
        return done(null, false, new Error('Invalid Password.'))
      }

      // 验证完成，返回用户信息
      done(null, user)
    } catch (err) {
      done(err)
    }
  }
))

passport.use(new jwtStrategy(
  {
    secretOrKey: tokenConfig.secret,
    jwtFromRequest,
    algorithm: tokenConfig.algorithm,
  },
  async ({ id }, done) => {
    try {
      const user = await User.findOne({ id })

      if (!user) {
        return done(null, false, new Error('No Such User.'))
      }

      done(null, user)
    } catch (err) {
      done(err)
    }
  }
))

module.exports = passport.initialize()
