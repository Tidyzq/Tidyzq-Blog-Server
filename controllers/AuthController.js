const passport = require('passport')

const tokenService = app.services.token

module.exports = {

  /**
   * 检查请求是否附带了合法的 access token
   */
  hasAccessToken (req, res, next) {
    passport.authenticate('jwt', (err, user) => {
      if (err) {
        log.verbose(`AuthController::hasAccessToken ${err.message}`)
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
    user.create()
      .then(() => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose('AuthController.register ::', err.message)
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
