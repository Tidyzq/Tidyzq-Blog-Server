const jwt = require('jsonwebtoken')
const tokenConfig = app.get('token')

const extractRegex = /^(\S+)\s+(\S+)$/

const tokenService = {

  /**
   * 从 auth 头部提取 token
   */
  extractTokenFromHeader (req) {

    const authorization = req.get(tokenConfig.headerField)
    if (!authorization) {
      return log.verbose('No Authorization Header')
    }

    const matches = authorization.match(extractRegex)
    if (!matches) {
      return log.verbose('Invalid Authorization Header')
    }

    const [ , schema, value ] = matches
    if (schema !== tokenConfig.headerScheme) {
      return log.verbose('Invalid Authorization Scheme')
    }
    return value
  },

  /**
   * 产生 access token
   */
  createAccessToken (user) {
    return jwt.sign(
      {
        user: user._id,
      },
      tokenConfig.secret,
      {
        algorithm: tokenConfig.algorithm,
        expiresIn: tokenConfig.expires,
        // issuer: tokenConfig.issuer,
        // audience: tokenConfig.audience
      }
    )
  },

  /**
   * 验证 access token
   */
  verifyAccessToken (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, tokenConfig.secret, (err, decoded) => {
        if (err) { return reject(err) }
        resolve(decoded)
      })
    })
  },

}

module.exports = tokenService
