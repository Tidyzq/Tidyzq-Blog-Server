const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const jwtStrategy = require('passport-jwt').Strategy
const bcrypt = require('bcrypt')

const tokenConfig = app.get('token')
const jwtFromRequest = app.services.token.extractTokenFromHeader

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  app.models.user.findOne({ id })
    .then(user => done(null, user))
    .catch(err => done(err))
})

passport.use(new localStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  (email, password, done) => {

    app.models.user.findOne({ email })
      // 检查用户是否存在
      .then(user => {
        if (!user) { throw new Error('No Such User.') }
        return user
      })
      // 检查用户密码是否正确
      .then(user => {
        return bcrypt.compare(password, user.password)
          .then(result => {
            if (!result) { throw new Error('Invalid Password.') }
            return user
          })
      })
      // 验证完成，返回用户信息
      .then(user => done(null, user))
      // 验证失败，返回错误信息
      .catch(done)
  }
))

passport.use(new jwtStrategy(
  {
    secretOrKey: tokenConfig.secret,
    jwtFromRequest,
    algorithm: tokenConfig.algorithm,
  },
  ({ id }, done) => {
    app.models.user.findOne({ id })
      .then(user => {
        if (!user) { throw new Error('No Such User.') }
        return user
      })
      .then(user => done(null, user))
      .catch(done)
  }
))

module.exports = passport.initialize()
