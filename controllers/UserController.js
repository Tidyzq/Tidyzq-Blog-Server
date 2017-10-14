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
  async hasUser (req, res, next) {
    try {
      let user = req.data.user

      if (!user) {
        user = await User.findOne({ id: req.params.userId })
      }
      if (!user) { // user not exists
        throw new Error('user not found.')
      }
      req.data.user = user
      next()
    } catch (err) {
      log.verbose(`UserController.hasUser :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取用户列表
   */
  async getUsers (req, res) {
    try {
      const [ users, count ] = await Promise.all([
        User.find({
          $where: req.query.where,
          $limit: req.query.limit,
          $offset: req.query.offset,
          $sort: req.query.sort,
        }),
        User.count({ $where: req.query.where }),
      ])

      res.set('X-Total-Count', count)
      res.ok(users)
    } catch (err) {
      log.verbose(`UserController.getUsers :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取用户信息
   */
  getUser (req, res) {
    try {
      const user = req.data.user

      res.ok(user)
    } catch (err) {
      log.verbose(`UserController::getUser' ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 新增用户
   */
  async createUser (req, res) {
    try {
      // 由请求参数构造待创建User对象
      const user = new User(_.pickBy(req.body, _.identity))

      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(user.password, salt)

      user.password = hash
      log.verbose('UserController.createUser :: encrypting succeed')

      user.id = await user.create()

      res.ok(user)
    } catch (err) {
      log.verbose(`UserController.createUser :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 更改用户信息
   */
  async updateUser (req, res) {
    try {
      const value = _.pick(req.body, [ 'username', 'avatar' ])
      const user = _.merge(req.data.user, value)

      await user.update()

      res.ok(user)
    } catch (err) {
      log.verbose(`UserController.updateUser :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 删除用户
   */
  async deleteUser (req, res) {
    try {
      const user = req.data.user

      await user.destroy()

      res.ok(user)
    } catch (err) {
      log.verbose(`UserController.deleteUser :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 修改密码
   */
  async updateUserPassword (req, res) {
    try {
      const { newPassword, oldPassword } = req.body
      const user = req.data.user

      if (!await bcrypt.compare(oldPassword, user.password)) {
        throw new Error('Invalid Password.')
      }

      const salt = await bcrypt.genSalt(10)
      const hash = await bcrypt.hash(newPassword, salt)
      user.password = hash
      log.verbose('UserController.updateUserPassword :: encrypting succeed')

      await user.update()

      res.ok(user)
    } catch (err) {
      log.verbose(`UserController.updateUserPassword :: ${err}`)
      res.badRequest(err.message)
    }
  },

}
