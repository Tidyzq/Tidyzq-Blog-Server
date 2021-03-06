/* eslint no-eval: 'off' */
const log = require('../services/log')
const dao = require('../services/dao')
const _ = require('lodash')

function _notImplement () {
  throw new Error('Not Implemented')
}

function Model () {}

Model.prototype.create =
Model.prototype.update =
Model.prototype.destroy =
Model.init =
Model.find =
Model.findOne =
Model.count =
Model.update =
Model.destroy =
Model.create = _notImplement

const models = {}

function _getModel (tableName) {
  if (_.has(models, tableName)) {
    return models[tableName]
  }
  log.error(`modelHelper._getModel :: model ${tableName} is undefined`)
}

/**
 * splitFields
 * @param {Object} fields
 * fields: {
 *   field1: { ... },
 *   field2: { ..., key: true },
 *   field3: { ..., foreign: 'Other.key' }
 * }
 * => {
 *   keys: {
 *     fields: { ..., key: true }
 *   },
 *   foreign: {
 *     field3: { ..., foreign: 'Other.key' }
 *   }
 * }
 */
function splitFields (fields) {
  return {
    keys: _.pickBy(fields, field => field.key),
    foreigns: _.pickBy(fields, field => field.foreign),
  }
}

/**
 * solveFields
 * @param {Object} fields
 * @param {Object} splited
 * fields: {
 *   field1: { type: 'text', unique: true, notNull: true },
 *   field2: { type: 'int', key: true, default: 0 },
 *   field3: { type: 'int', foreign: 'Other.key' }
 * }
 * => {
 *   sql: `field1 text UNIQUE NOT NULL,
 *     field2 int DEFAULT 0,
 *     field2 int,
 *     PRIMARY KEY (field1),
 *     FOREIGN KEY (field2) REFERENCES Other (key)`,
 *   params: []
 * }
 */
function solveFields (fields, splited) {
  splited = splited || splitFields(fields)
  const { keys, foreigns } = splited
  const params = []

  const columnStates = _.map(fields, (field, fieldName) => {
    field = _.isString(field) ? { type: field } : field
    field.notNull = field.notNull ? 'NOT NULL' : ''
    field.unique = field.unique ? 'UNIQUE' : ''
    if (!_.isUndefined(field.default) && !_.isNull(field.default)) {
      // params.push(field.default)
      field.default = `DEFAULT ${field.default}`
    } else {
      field.default = ''
    }
    return `${fieldName} ${field.type} ${field.unique} ${field.notNull} ${field.default}`
  })

  const keysState = `PRIMARY KEY (${_.keys(keys).join(',')})`

  const foreignsState = _.map(foreigns, (field, fieldName) => {
    const [ table, column ] = field.foreign.split('.')
    return `FOREIGN KEY (${fieldName}) REFERENCES ${table} (${column})`
  })

  const sql = _.concat(columnStates, keysState, foreignsState).join(',\n')

  return {
    sql,
    params,
  }
}

/**
 * solveColumnAndValue
 * @param {Array<String>} fields
 * @param {Array<Object>} items
 * fields: [ 'field1', 'field2', 'field3' ]
 * items: [{
 *   field1: '1',
 *   field2: 1
 * }, {
 *   field1: '2',
 *   field2: 2,
 *   field3: 2
 * }]
 * => {
 *   columns: '(field1, field2, field3)',
 *   values: {
 *     sql: `(?, ?, ?),
 *       (?, ?, ?)`,
 *     params: [ '1', 1, null, '2', 2, 2 ]
 *   }
 * }
 */
function solveColumnAndValue (fields, items) {
  const sqlPlaceholder = _.fill(Array(fields.length), '?').join(',')
  const valueSql = _.fill(Array(items.length), `(${sqlPlaceholder})`).join(',')
  const valueParams = _.reduce(items, (result, item) => {
    for (const column of fields) {
      result.push(item[column])
    }
    return result
  }, [])

  return {
    columns: `(${fields.join(',')})`,
    values: {
      sql: valueSql,
      params: valueParams,
    },
  }
}

/**
 * solveSelect
 * @param {Array<String>} fields
 * @param {Array<String>} select
 * fields: [ 'field1', 'field2', 'field3' ]
 * select: [ 'field1', 'field4' ]
 * => {
 *   sql: `field1`,
 *   params: []
 * }
 */
function solveSelect (fields, select, prefix = '') {
  return {
    sql: select ? _.map(_.intersection(fields, select), field => `${prefix}${field}`).join(',') : `${prefix}*`,
    params: [],
  }
}

function _solveWhereInner (fields, where, prefix, params = []) {
  let result
  if (!where) {
    return {
      sql: '',
      params: [],
    }
  }
  if (where.$op) {
    const op = where.$op.toLowerCase() === 'or' ? ' OR ' : ' AND '
    result = _.compact(_.map(where.$conditions, item => _solveWhereInner(fields, item, prefix, params).sql)).join(op)
  } else {
    result = _.map(_.pick(_.pickBy(where, _.identity), fields), (value, key) => {
      if (value.$op && value.$op.toLowerCase() === 'in') {
        params.push.apply(params, value.$value)
        return `${prefix}${key} IN (${_.fill(Array(value.$value.length), '?').join(',')})`
      } else {
        let op = '='
        if (_.isObject(value)) {
          op = value.$op || '='
          value = value.$value
        }
        params.push(value)
        return `${prefix}${key} ${op} ?`
      }
    }).join(' AND ')
  }
  return {
    sql: result ? `(${result})` : '',
    params,
  }
}

/**
 * solveWhere
 * @param {Array<String>} fields
 * @param {Object} where
 * fields: [ 'field1', 'field2', 'field3' ]
 * where: {
 *   $or: [{
 *     field1: 1
 *   }, {
 *     field2: {
 *       op: '>=',
 *       value: 2
 *     }
 *   }]
 * }
 * => {
 *   sql: `WHERE (field1 = ?) OR (field2 >= ?)`,
 *   params: [ 1, 2 ]
 * }
 */
function solveWhere (fields, where, prefix = '') {
  const result = _solveWhereInner(fields, where, prefix)
  result.sql = result.sql ? `WHERE ${result.sql}` : ''
  return result
}

/**
 * solveLimit
 * @param {Array<String>} fields
 * @param {Number} limit
 * fields: [ 'field1', 'field2', 'field3' ]
 * limit: 10
 * => {
 *   sql: `LIMIT ?`,
 *   params: [ 10 ]
 * }
 */
function solveLimit (fields, limit) {
  return {
    sql: limit ? 'LIMIT ?' : '',
    params: limit ? [ limit ] : [],
  }
}

/**
 * solveOffset
 * @param {Array<String>} fields
 * @param {Number} offset
 * fields: [ 'field1', 'field2', 'field3' ]
 * offset: 10
 * => {
 *   sql: `OFFSET ?`,
 *   params: [ 10 ]
 * }
 */
function solveOffset (fields, offset) {
  return {
    sql: offset ? 'OFFSET ?' : '',
    params: offset ? [ offset ] : [],
  }
}

/**
 * solveSort
 * @param {Array<String>} fields
 * @param {Object} sort
 * fields: [ 'field1', 'field2', 'field3' ]
 * sort: {
 *   field1: 'asc',
 *   field2: 'desc'
 * }
 * => {
 *   sql: `ORDER BY field1 ASC, field2 DESC`,
 *   params: []
 * }
 */
function solveSort (fields, sort, prefix = '') {
  const sql = _.map(_.pick(sort, fields), (value, key) => {
    value = value.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    return `${prefix}${key} ${value}`
  }).join(',')
  return {
    sql: sql ? `ORDER BY ${sql}` : '',
    params: [],
  }
}

/**
 * solveJoin
 * @param {Array<String>} fields
 * @param {Object} join
 * fields: [ 'field1', 'field2', 'field3' ]
 * join: {
 *   from: 'a',
 *   to: 'b',
 *   through: {
 *     model: 'anotherModel',
 *     from: 'aa',
 *     to: 'ab'
 *   },
 *   target: 'target',
 *   where: {
 *     tfield: 1
 *   },
 *   limit: ...,
 *   offset: ...,
 *   sort: ...
 * }
 * => {
 *   target: Target,
 *   join: {
 *     sql: `JOIN anotherModel ON source.a = another.aa
 *       JOIN target ON another.ab = target.b`,
 *     params: []
 *   },
 *   where: {
 *     sql: 'target.tfield = ?,
 *     params: [ 1 ]
 *   }
 *   ...
 * }
 */
function solveJoin (fields, join) {
  if (!join || _.isEmpty(join)) {
    return {}
  }
  let { target, select, where, limit, offset, sort } = join
  const { through, from, to } = join

  if (_.isString(target)) {
    target = _getModel(target)
  }
  if (!_.isUndefined(through) && _.isString(through.model)) {
    through.model = _getModel(through.model)
  }

  let joinSql = ''

  if (!through) {
    joinSql = `JOIN ${target.tableName} ON Source.${from} = ${target.tableName}.${to}`
  } else {
    joinSql = `JOIN ${through.model.tableName} ON Source.${from} = ${through.model.tableName}.${through.from}
      JOIN ${target.tableName} ON ${through.model.tableName}.${through.to} = ${target.tableName}.${to}`
  }

  const prefix = `${target.tableName}.`
  const targetFields = _.keys(target.options.fields)

  ;({ select, where, limit, offset, sort } = solveQuery(targetFields, { $select: select, $where: where, $limit: limit, $offset: offset, $sort: sort }, prefix))

  return {
    join: {
      sql: joinSql,
      params: [],
    },
    select,
    where,
    limit,
    offset,
    sort,
    target,
  }
}

/**
 * solveQuery
 * @param {Array<String>} fields
 * @param {Object} query
 */
function solveQuery (fields, query, prefix = '') {
  let { $select: select, $where: where, $join: join, $limit: limit, $offset: offset, $sort: sort } = query
  if (!_.has(query, '$where')) {
    where = query
  }
  select = solveSelect(fields, select, prefix)
  where = solveWhere(fields, where, prefix)
  join = solveJoin(fields, join, prefix)
  limit = solveLimit(fields, limit, prefix)
  offset = solveOffset(fields, offset, prefix)
  sort = solveSort(fields, sort, prefix)

  return { select, where, join, limit, offset, sort }
}

/**
 * solveSet
 * @param {Array<String>} fields
 * @param {Object} set
 * fields: [ 'field1', 'field2', 'field3' ]
 * set: {
 *   field1: 1,
 *   field2: 2
 * }
 * => {
 *   sql: `field1 = ?, field2 = ?`,
 *   params: [ 1, 2 ]
 * }
 */
function solveSet (fields, set) {
  const params = []
  const sql = _.compact(_.map(_.pick(set, fields), (value, key) => {
    if (!_.isUndefined(value) && !_.isNull(value)) {
      params.push(value)
      return `${key} = ?`
    }
  })).join(',')
  return {
    sql,
    params,
  }
}

function defineModel (tableName, options) {
  const { fields, indexes, methods, staticMethods } = options

  if (_.has(models, tableName)) {
    log.error(`modelHelper.defineModel :: model ${tableName} is already exists!`)
  }

  const { keys, foreigns } = splitFields(fields)

  const flattenFields = _.keys(fields)
  const flattenKeys = _.keys(keys)
  // const flattenForeigns = _.keys(foreigns)

  /**
   * model.constructor
   */
  const model = function (data) {
    Model.call(this)
    this.assign(data)
  }

  model.tableName = tableName
  model.options = options

  /**
   * mode.prototype.assign
   */
  const assign = eval(`(function (data) {
    ${
  _.map(fields, (fieldConfig, field) => {
    return `this.${field} = data.${field}`
  }).join('\n')
}
  })`)

  /**
   * model.init
   */
  model.init = function () {
    return new Promise((resolve, reject) => {
      // create table
      const fieldStates = solveFields(fields, { keys, foreigns })
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${fieldStates.sql}
      )`
      const params = fieldStates.params
      log.silly(sql, params)
      dao.run(sql, params,
        err => {
          err ? reject(err) : resolve()
        })
    })
      .then(() => {
      // create indexes
        return Promise.all(
          _.map(indexes, ({ name, fields }) => {
            return new Promise((resolve, reject) => {
              const sql = `CREATE INDEX IF NOT EXISTS ${name} ON ${tableName} (
              ${fields.join(',')}
            )`
              log.silly(sql)
              dao.run(sql, err => {
                err ? reject(err) : resolve()
              })
            })
          })
        )
      })
  }

  /**
   * model.find
   */
  model.find = function (query) {
    const { select, where, join, sort, limit, offset } = solveQuery(flattenFields, query || {})

    let sql = `SELECT ${select.sql} FROM ${tableName} ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
    let params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)
    let target = model

    if (!_.isEmpty(join)) {
      sql = `SELECT ${join.select.sql} FROM (${sql}) AS Source ${join.join.sql} ${join.where.sql} ${join.sort.sql} ${join.limit.sql} ${join.offset.sql}`
      params = _.concat(join.select.params, params, join.join.params, join.where.params, join.sort.params, join.limit.params, join.offset.params)
      target = join.target
    }

    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.all(sql, params, (err, rows) => {
        err ? reject(err) : resolve(_.map(rows, row => new target(row)))
      })
    })
  }

  /**
   * model.findOne
   */
  model.findOne = function (query) {
    const { select, where, join, sort, limit, offset } = solveQuery(flattenFields, query || {})

    let sql = `SELECT ${select.sql} FROM ${tableName} ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
    let params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)
    let target = model

    if (!_.isEmpty(join)) {
      sql = `SELECT ${join.select.sql} FROM (${sql}) AS Source ${join.join.sql} ${join.where.sql} ${join.sort.sql} ${join.limit.sql} ${join.offset.sql}`
      params = _.concat(join.select.params, params, join.join.params, join.where.params, join.sort.params, join.limit.params, join.offset.params)
      target = join.target
    }

    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.get(sql, params, (err, row) => {
        err ? reject(err) : resolve(row && new target(row))
      })
    })
  }

  /**
   * model.count
   */
  model.count = function (query) {
    const { select, where, join, sort, limit, offset } = solveQuery(flattenFields, query || {})
    let sql, params

    if (!_.isEmpty(join)) {
      sql = `SELECT ${select.sql} FROM ${tableName} ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
      params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)

      sql = `SELECT COUNT(*) FROM (${sql}) AS Source ${join.join.sql} ${join.where.sql} ${join.sort.sql} ${join.limit.sql} ${join.offset.sql}`
      params = _.concat(params, join.join.params, join.where.params, join.sort.params, join.limit.params, join.offset.params)
    } else {
      sql = `SELECT COUNT(*) FROM ${tableName} ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
      params = _.concat(where.params, sort.params, limit.params, offset.params)
    }

    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.get(sql, params, (err, row) => {
        err ? reject(err) : resolve(row['COUNT(*)'])
      })
    })
  }

  /**
   * model.destroy
   */
  model.destroy = function (where) {
    where = solveWhere(flattenFields, where)

    const sql = `DELETE FROM ${tableName} ${where.sql}`
    const params = where.params
    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.changes)
      })
    })
  }

  /**
   * model.update
   */
  model.update = function (where, set) {
    where = solveWhere(flattenFields, where)
    set = solveSet(flattenFields, set)

    const sql = `UPDATE ${tableName} SET ${set.sql} ${where.sql}`
    const params = _.concat(set.params, where.params)
    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.changes)
      })
    })
  }

  /**
   * model.create
   */
  model.create = function (items) {
    const { columns, values } = solveColumnAndValue(flattenFields, items)

    const sql = `INSERT INTO ${tableName} ${columns} VALUES ${values.sql}`
    const params = values.params
    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.lastID)
      })
    })
  }

  /**
   * model.save
   */
  model.save = function (items) {
    const { columns, values } = solveColumnAndValue(flattenFields, items)

    const sql = `INSERT OR REPLACE INTO ${tableName} ${columns} VALUES ${values.sql}`
    const params = values.params
    log.silly(sql, params)
    return new Promise((resolve, reject) => {
      dao.run(sql, params, function (err) {
        err ? reject(err) : resolve(this.lastID)
      })
    })
  }

  /**
   * model.prototype.create
   */
  const create = function () {
    return model.create([ this ])
  }

  /**
   * model.prototype.update
   */
  const update = eval(`(function () {
    return model.update({${
  _.map(flattenKeys, key => {
    return `${key}: this.${key}`
  }).join(',')
}}, {${
  _.map(_.xor(flattenKeys, flattenFields), key => {
    return `${key}: this.${key}`
  }).join(',')
}})
  })`)

  /**
   * model.prototype.save
   */
  const save = function () {
    return model.save([ this ])
  }

  /**
   * model.prototype.destroy
   */
  const destroy = eval(`(function () {
    return model.destroy({${
  _.map(flattenKeys, key => {
    return `${key}: this.${key}`
  }).join(',')
}})
  })`)

  /**
   * model.prototype.toObject
   */
  const toJSON = eval(`(function () {
    return _.omit(this, [${
  _.compact(_.map(fields, (field, fieldName) => {
    if (field.hide) {
      return `'${fieldName}'`
    }
  })).join(',')
}])
  })`)

  /**
   * model.prototype.toString
   */
  const toString = function () {
    return JSON.stringify(this)
  }

  _.assign(model, staticMethods)

  model.prototype = _.create(Model.prototype, _.assign({
    constructor: model,
    assign,
    create,
    update,
    save,
    destroy,
    toJSON,
    toString,
  }, methods))

  models[tableName] = model

  return model
}

exports.splitFields = splitFields

exports.solveFields = solveFields

exports.solveColumnAndValue = solveColumnAndValue

exports.solveSelect = solveSelect

exports.solveWhere = solveWhere

exports.solveLimit = solveLimit

exports.solveOffset = solveOffset

exports.solveSort = solveSort

exports.solveQuery = solveQuery

exports.solveSet = solveSet

exports.defineModel = defineModel
