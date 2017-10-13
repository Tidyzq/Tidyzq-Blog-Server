const User = app.models.User
// const Document = app.models.document
const bcrypt = require('bcrypt')

module.exports = {

  /**
   * 检查是否是用户自身
   */
  isSelf (req, res, next) {
    if (req.data.auth && req.params.userId && req.data.auth.id === parseInt(req.params.userId)) {
      req.data.user = req.data.auth
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

    Promise.all([
      User.find({
        $where: req.query.where,
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.sort,
      }),
      User.count({ $where: req.query.where }),
    ])
    .then(([ users, count ]) => {
      res.set('X-Total-Count', count)
      res.ok(users)
    })
    .catch(err => {
      log.verbose(`UserController.getUsers :: ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取用户信息
   */
  getUser (req, res) {

    Promise.resolve(req.data.user)
      .then(user => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController::getUser' ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 新增用户
   */
  createUser (req, res) {
    // 由请求参数构造待创建User对象
    const user = new User(_.pickBy(req.body, _.identity))

    bcrypt.genSalt(10)
      .then(salt => bcrypt.hash(user.password, salt))
      .then(hash => {
        user.password = hash
        log.verbose('UserController.createUser :: encrypting succeed')
        return user.create()
      })
      .then(id => {
        user.id = id
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.createUser :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 更改用户信息
   */
  updateUser (req, res) {
    const value = _.pick(req.body, [ 'username', 'avatar' ])

    Promise.resolve(req.data.user)
      .then(user => {
        user = _.merge(user, value)
        return user.update().then(() => user)
      })
      .then(user => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.updateUser :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 删除用户
   */
  deleteUser (req, res) {
    const user = req.data.user

    user.destroy()
      .then(() => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.deleteUser :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 修改密码
   */
  updateUserPassword (req, res) {
    const { newPassword, oldPassword } = req.body
    const user = req.data.user

    bcrypt.compare(oldPassword, user.password)
      .then(result => {
        if (!result) {
          throw new Error('Invalid Password.')
        }
      })
      .then(() => bcrypt.genSalt(10))
      .then(salt => bcrypt.hash(newPassword, salt))
      .then(hash => {
        user.password = hash
        log.verbose('UserController.updateUserPassword :: encrypting succeed')
        return user.update()
      })
      .then(() => {
        res.ok(user)
      })
      .catch(err => {
        log.verbose(`UserController.updateUserPassword :: ${err}`)
        res.badRequest(err.message)
      })
  },

}
