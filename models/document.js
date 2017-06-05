const { defineModel } = require('../utils/modelHelper')

module.exports = defineModel('Documents', {
  fields: {
    id: {
      type: 'INTEGER',
      notNull: true,
      key: true,
      autoincrement: true,
    },
    title: {
      type: 'TEXT',
      notNull: true,
    },
    url: {
      type: 'TEXT',
      notNull: true,
      unique: true,
    },
    markdown: {
      type: 'TEXT',
      notNull: true,
    },
    modifiedAt: {
      type: 'DATETIME',
      notNull: true,
    },
    createdAt: {
      type: 'DATETIME',
      notNull: true,
    },
    author: {
      type: 'INTEGER',
      notNull: true,
      foreign: 'Users.id',
    },
  },
  indexes: [{
    name: 'Idx_Documents_url',
    fields: [ 'url' ],
  }, {
    name: 'Idx_Documents_author',
    fields: [ 'author' ],
  }],
})

// class Document extends Model {

//   constructor (data) {
//     super()
//     this.id = data.id
//     this.title = data.title
//     this.url = data.url
//     this.markdown = data.markdown
//     this.modifiedAt = data.modifiedAt
//     this.createdAt = data.createdAt
//     this.author = data.author
//   }

//   static createTable () {
//     return new Promise((resolve, reject) => {
//       app.sqlite.run(`CREATE TABLE IF NOT EXISTS Documents (
//         id         INTEGER  PRIMARY KEY AUTOINCREMENT,
//         title      TEXT     NOT NULL,
//         url        TEXT     UNIQUE NOT NULL,
//         markdown   TEXT     NOT NULL,
//         modifiedAt DATETIME NOT NULL,
//         createdAt  DATETIME NOT NULL,
//         author     INTEGER  REFERENCES Users(id) ON DELETE CASCADE
//       );
//       CREATE INDEX IF NOT EXISTS Idx_Documents_url ON Documents (
//         url
//       );
//       CREATE INDEX IF NOT EXISTS Idx_Documents_author ON Documents (
//         author
//       );`,
//       err => {
//         err ? reject(err) : resolve()
//       })
//     })
//   }

//   static init () {
//     return this.createTable()
//   }

//   beforeCreate () {
//     return Promise.resolve()
//       .then(() => {
//         if (_.isUndefined(this.url)) {
//           return generateUrl(Document, this.title)
//             .then(url => {
//               this.url = url
//               log.verbose(`DocumentModel :: generated url ${url}`)
//             })
//         }
//       })
//       .then(() => {
//         this.createdAt = this.modifiedAt = new Date()
//       })
//   }

//   create () {
//     return this.beforeCreate()
//       .then(() => {
//         return new Promise((resolve, reject) => {
//           app.sqlite.run(`INSERT INTO Documents (
//               title, url, markdown, modifiedAt, createdAt, author
//             ) VALUES (
//               ?, ?, ?, ?, ?, ?
//             )`,
//             [ this.title, this.url, this.markdown, this.modifiedAt, this.createdAt, this.author ],
//             function (err) {
//               err ? reject(err) : resolve(this.lastID)
//             })
//         })
//       })
//   }

//   update () {
//     const set = solveSet({
//       title: this.title,
//       url: this.url,
//       markdown: this.markdown,
//       modifiedAt: this.modifiedAt,
//       createdAt: this.createdAt,
//       author: this.author,
//     })

//     const sql = `UPDATE Documents SET ${set.sql} WHERE id = ?`
//     const params = _.concat(set.params, this.id)
//     return new Promise((resolve, reject) => {
//       app.sqlite.run(sql, params,
//       function (err) {
//         err ? reject(err) : resolve(this.changes)
//       })
//     })
//   }

//   delete () {
//     return new Promise((resolve, reject) => {
//       app.sqlite.run('DELETE FROM Documents WHERE id = ?',
//       [ this.id ],
//       err => {
//         err ? reject(err) : resolve()
//       })
//     })
//   }

//   static find (query) {
//     const { select, where, sort, limit, offset } = solveQuery(query)

//     const sql = `SELECT ${select.sql} FROM Documents ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
//     const params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)
//     console.log(sql, params)
//     return new Promise((resolve, reject) => {
//       app.sqlite.all(sql, params, (err, rows) => {
//         err ? reject(err) : resolve(_.map(rows, row => new Document(row)))
//       })
//     })
//   }

//   static findOne (query) {
//     const { select, where, sort } = solveQuery(query)

//     const sql = `SELECT ${select.sql} FROM Documents ${where.sql} ${sort.sql}`
//     const params = _.concat(select.params, where.params, sort.params)
//     return new Promise((resolve, reject) => {
//       app.sqlite.get(sql, params, (err, row) => {
//         err ? reject(err) : resolve(row && new Document(row))
//       })
//     })
//   }

//   static count (query) {
//     const { where } = solveQuery(query)

//     const sql = `SELECT COUNT(*) FROM Documents ${where.sql}`
//     const params = where.params
//     return new Promise((resolve, reject) => {
//       app.sqlite.get(sql, params, (err, row) => {
//         err ? reject(err) : resolve(row['COUNT(*)'])
//       })
//     })
//   }

//   static delete (where) {
//     where = solveWhere(where)

//     const sql = `DELETE FROM Documents ${where.sql}`
//     const params = where.params
//     return new Promise((resolve, reject) => {
//       app.sqlite.run(sql, params, function (err) {
//         err ? reject(err) : resolve(this.changes)
//       })
//     })
//   }

//   static update (where, set) {
//     where = solveWhere(where)
//     set = solveSet(set)

//     const sql = `UPDATE Documents SET ${set.sql} ${where.sql}`
//     const params = _.concat(set.params, where.params)
//     return new Promise((resolve, reject) => {
//       app.sqlite.run(sql, params, function (err) {
//         err ? reject(err) : resolve(this.changes)
//       })
//     })
//   }

//   toJSON () {
//     return this
//   }

//   toString () {
//     return JSON.stringify(this)
//   }

// }

// module.exports = Document
