// const log = require('../services/log')
// const _ = require('lodash')
const passport = require('passport')
const TokenService = require('../services/token')

module.exports = {

  /**
   * 检查请求是否附带了合法的 access token
   */
  async hasAccessToken (req, res, next) {
    const { user, fail } = await new Promise((resolve, reject) => {
      passport.authenticate('jwt', (err, user, fail) => {
        if (err) { return reject(err) }
        resolve({ user, fail })
      })(req, res, next)
    })

    if (fail) {
      return res.unauthorized(fail.message)
    }
    req.data.auth = user
    next()
  },

  /**
   * 登陆
   */
  async login (req, res, next) {
    const { user, fail } = await new Promise((resolve, reject) => {
      passport.authenticate('local', function (err, user, fail) {
        if (err) { reject(err) }
        resolve({ user, fail })
      })(req, res, next)
    })

    if (fail) {
      return res.badRequest(fail.message)
    }

    const accessToken = TokenService.createAccessToken(user)

    // 将 token 作为 http body 返回
    return res.ok({
      user,
      accessToken,
    })
  },

  /**
   * 检查登陆
   */
  checkLogin (req, res) {
    res.ok()
  },

}
