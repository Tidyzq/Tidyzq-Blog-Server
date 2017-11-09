const log = require('./log')
// const _ = require('lodash')
const sqlite = require('sqlite3').verbose()
const sqliteConfig = require('../configs').connection.sqlite

const file = sqliteConfig.file || ':memory:'
const dao = new sqlite.Database(file)
log.info(`SQLite connected to ${file}`)

module.exports = dao
