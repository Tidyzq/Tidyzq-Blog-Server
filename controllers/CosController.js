const cosService = app.services.cos

module.exports = {
  /**
   * 获取 COS Token
   */
  getToken (req, res) {
    try {
      const method = req.query.method || '*'
      const key = req.query.key || ''
      const auth = cosService.getAuth(method, key)
      res.ok({ token: auth })
    } catch (err) {
      log.verbose(`ImageController.upload :: ${err.stack}`)
      res.badRequest(err)
    }
  },
}
