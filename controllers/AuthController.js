const passport = require('passport')
const TokenService = app.services.token

module.exports = {

  /**
   * 检查请求是否附带了合法的 access token
   */
  hasAccessToken (req, res, next) {
    passport.authenticate('jwt', (err, user, fail) => {
      if (!user && !err && fail) {
        err = fail
      }
      if (err) {
        log.verbose(`AuthController.hasAccessToken :: ${err}`)
        return res.unauthorized(err.message)
      }
      req.data.auth = user
      next()
    })(req, res, next)
  },

  /**
   * 登陆
   */
  login (req, res, next) {
    passport.authenticate('local', function (err, user, fail) {
      if (!user && !err && fail) {
        err = fail
      }
      if (err) {
        log.verbose(`AuthController.login :: ${err}`)
        return res.badRequest(err.message)
      }

      const accessToken = TokenService.createAccessToken(user)

      // 将 token 作为 http body 返回
      return res.ok({
        user,
        accessToken,
      })

    })(req, res, next)
  },

  /**
   * 检查登陆
   */
  checkLogin (req, res) {
    res.ok()
  },

}
