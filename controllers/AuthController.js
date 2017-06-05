const passport = require('passport')
const bcrypt = require('bcrypt')

const tokenService = app.services.token

module.exports = {

  /**
   * 检查请求是否附带了合法的 access token
   */
  hasAccessToken (req, res, next) {
    passport.authenticate('jwt', (err, user) => {
      if (!user && !err) {
        err = new Error('No Access Token Provided.')
      }
      if (err) {
        log.verbose(`AuthController::hasAccessToken ${err}`)
        return res.unauthorized(err.message)
      }
      req.user = user
      next()
    })(req, res, next)
  },

  /**
   * 注册
   */
  register (req, res, next) {
    // 由请求参数构造待创建User对象
    const User = app.models.user

    const user = new User(req.body)

    bcrypt.genSalt(10)
      .then(salt => bcrypt.hash(user.password, salt))
      .then(hash => {
        user.password = hash
        log.verbose('AuthController.register :: encrypting succeed')
        return user.create()
      })
      .then(id => {
        user.id = id
      })
      .then(() => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`AuthController.register :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 登陆
   */
  login (req, res, next) {
    passport.authenticate('local', function (err, user) {
      if (err) {
        log.verbose('AuthController::login', err.message)
        return res.badRequest(err.message)
      }

      const accessToken = tokenService.createAccessToken(user)

      // 将 token 作为 http body 返回
      return res.ok({
        user,
        accessToken,
      })

    })(req, res, next)
  },

}
