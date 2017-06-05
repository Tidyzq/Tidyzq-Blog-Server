const User = app.models.user
// const Document = app.models.document

module.exports = {

  /**
   * 检查是否是用户自身
   */
  isSelf (req, res, next) {
    if (req.user && req.params.id && req.user.id === parseInt(req.params.id)) {
      return next()
    }
    log.verbose('UserController.isSelf :: Unauthorized')
    res.unauthorized('not user self.')
  },

  /**
   * 检查用户是否存在
   */
  hasUser (req, res, next) {
    const id = req.params.id

    User.findOne({ id })
      .then(user => {
        if (!user) {
          throw new Error('user not found.')
        }
      })
      .then(next)
      .then(err => {
        log.verbose(`UserController.hasUser :: ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 获取用户信息
   */
  getUserById (req, res, next) {
    const id = req.params.id

    User.findOne({ id })
      .then(user => {
        if (user) { return user }
        throw new Error('User Not Found')
      })
      // .then(user => {
      //   if (req.query.documents) {
      //     return Document.find({ author: id })
      //       .then(documents => {
      //         user.documents = documents
      //         return user
      //       })
      //   }
      //   return user
      // })
      .then(user => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController::getUser' ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 更改用户信息
   */
  updateUserById (req, res, next) {
    const value = req.body
    const user = _.merge(req.user, value)

    Promise.resolve(req.user)
      .then(user => {
        user = _.merge(user, value)
        return user.update()
      })
      .then(() => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.updateUser :: ${err}`)
        res.badRequest(req.message)
      })
  },

}
