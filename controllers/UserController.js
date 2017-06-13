const User = app.models.User
// const Document = app.models.document

module.exports = {

  /**
   * 检查是否是用户自身
   */
  isSelf (req, res, next) {
    if (req.data.auth && req.params.userId && req.data.auth.id === parseInt(req.params.userId)) {
      return next()
    }
    log.verbose('UserController.isSelf :: Unauthorized')
    res.unauthorized('not user self.')
  },

  /**
   * 检查用户是否存在
   */
  hasUser (req, res, next) {

    Promise.resolve(req.data.user)
    .then(user => {
      return user || User.findOne({ id: req.params.userId })
    })
    .then(user => {
      if (!user) {
        throw new Error('user not found.')
      }
      req.data.user = user
      next()
    })
    .catch(err => {
      log.verbose(`UserController.hasUser :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取用户列表
   */
  getUsers (req, res) {

    User.find({
      $where: req.query.where,
      $limit: req.query.limit,
      $offset: req.query.offset,
      $sort: req.query.sort,
    })
      .then(users => {
        return User.count()
          .then(count => {
            res.set('X-Total-Count', count)
            res.ok(users)
          })
      })
      .catch(err => {
        log.verbose(`UserController.getUsers :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 获取用户信息
   */
  getUserById (req, res) {

    Promise.resolve(req.data.user)
      .then(user => {
        return user || User.findOne({ id: req.params.userId })
      })
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
  updateUserById (req, res) {
    const value = _.pick(req.body, [ 'username', 'avatar' ])

    Promise.resolve(req.data.user)
      .then(user => {
        return user || User.findOne({ id: req.params.userId })
      })
      .then(user => {
        user = _.merge(user, value)
        return user.update().then(() => user)
      })
      .then(user => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.updateUser :: ${err}`)
        res.badRequest(req.message)
      })
  },

}
