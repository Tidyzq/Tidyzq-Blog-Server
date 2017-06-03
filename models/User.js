const Promise = require('bluebird')
const bcrypt = Promise.promisifyAll(require('bcrypt'))
const { solveWhere, solveQuery, solveSet } = require('../utils/modelHelper')

class User {

  constructor (data) {
    this.id = data.id
    this.username = data.username
    this.password = data.password
    this.email = data.email || ''
    this.avatar = data.avatar || ''
  }

  static init () {
    return new Promise((resolve, reject) => {
      app.sqlite.run(`CREATE TABLE IF NOT EXISTS Users (
        id       INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT    NOT NULL,
        password TEXT    NOT NULL,
        email    TEXT    NOT NULL,
        avatar   TEXT    NOT NULL
      )`, err => {
        err ? reject(err) : resolve()
      })
    })
  }

  beforeCreate () {
    return bcrypt.genSalt(10)
      .then(salt => bcrypt.hash(this.password, salt))
      .then(hash => {
        this.password = hash
        log.verbose('UserModel :: encrypting succeed')
      })
  }

  create () {
    return this.beforeCreate()
      .then(() => {
        return new Promise((resolve, reject) => {
          app.sqlite.run(`INSERT INTO Users (
              username, password, email, avatar
            ) VALUES (
              ?, ?, ?, ?
            )`,
            [ this.username, this.password, this.email, this.avatar ],
            err => {
              err ? reject(err) : resolve()
            })
        })
      })
  }

  update () {
    const set = solveSet({
      username: this.username,
      email: this.email,
      avatar: this.avatar,
    })

    const sql = `UPDATE Users SET ${set.sql} WHERE id = ?`
    const params = _.concat(set.params, this.id)
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params,
      function (err) {
        err ? reject(err) : resolve(this.changes)
      })
    })
  }

  delete () {
    return new Promise((resolve, reject) => {
      app.sqlite.run('DELETE FROM Users WHERE id = ?',
      [ this.id ],
      err => {
        err ? reject(err) : resolve()
      })
    })
  }

  static find (query) {
    const { select, where, sort, limit, offset } = solveQuery(query)

    const sql = `SELECT ${select.sql} FROM Users ${where.sql} ${sort.sql} ${limit.sort} ${offset.sort}`
    const params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)
    return new Promise((resolve, reject) => {
      app.sqlite.all(sql, params, (err, rows) => {
        err ? reject(err) : resolve(_.map(rows, row => new User(row)))
      })
    })
  }

  static findOne (query) {
    const { select, where, sort } = solveQuery(query)

    const sql = `SELECT ${select.sql} FROM Users ${where.sql} ${sort.sql}`
    const params = _.concat(select.params, where.params, sort.params)
    return new Promise((resolve, reject) => {
      app.sqlite.get(sql, params, (err, row) => {
        err ? reject(err) : resolve(new User(row))
      })
    })
  }

  static count (query) {
    const { where } = solveQuery(query)

    const sql = `SELECT COUNT(*) FROM Users ${where.sql}`
    const params = where.params
    return new Promise((resolve, reject) => {
      app.sqlite.get(sql, params, (err, row) => {
        err ? reject(err) : resolve(row['COUNT(*)'])
      })
    })
  }

  static delete (where) {
    where = solveWhere(where)

    const sql = `DELETE FROM Users ${where.sql}`
    const params = where.params
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.changes)
      })
    })
  }

  static update (where, set) {
    where = solveWhere(where)
    set = solveSet(set)

    const sql = `UPDATE Users SET ${set.sql} ${where.sql}`
    const params = _.concat(set.params, where.params)
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.changes)
      })
    })
  }

  toString () {
    return JSON.stringify({
      id: this.id,
      username: this.username,
      email: this.email,
      avatar: this.avatar,
    })
  }

}

module.exports = User
