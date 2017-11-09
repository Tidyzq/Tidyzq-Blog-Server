const jwt = require('jsonwebtoken')
const log = require('./log')
const tokenConfig = require('../configs').token

const { headerField, headerScheme, secret, algorithm, expires } = tokenConfig

const extractRegex = /^(\S+)\s+(\S+)$/

const tokenService = {

  /**
   * 从 auth 头部提取 token
   */
  extractTokenFromHeader (req) {

    const authorization = req.get(headerField)
    if (!authorization) {
      log.verbose('No Authorization Header')
      return null
    }

    const matches = authorization.match(extractRegex)
    if (!matches) {
      log.verbose('Invalid Authorization Header')
      return null
    }

    const [ , schema, value ] = matches
    if (schema !== headerScheme) {
      log.verbose('Invalid Authorization Scheme')
      return null
    }
    return value
  },

  /**
   * 产生 access token
   */
  createAccessToken (user) {
    return jwt.sign(
      {
        id: user.id,
      },
      secret,
      {
        algorithm,
        expiresIn: expires,
        // issuer: issuer,
        // audience: audience
      }
    )
  },

  /**
   * 验证 access token
   */
  verifyAccessToken (token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, decoded) => {
        if (err) { return reject(err) }
        resolve(decoded)
      })
    })
  },

}

module.exports = tokenService
