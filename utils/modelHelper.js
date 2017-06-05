const _ = require('lodash')
// const Promise = require('bluebird')

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

function splitFields (fields) {
  return {
    keys: _.pickBy(fields, field => field.key),
    foreigns: _.pickBy(fields, field => field.foreign),
    // normal: _.pickBy(fields, field => !field.key && !field.foreign),
  }
}

function solveFields (fields, splited) {
  splited = splited || splitFields(fields)
  const { keys, foreigns } = splited

  const columnStates = _.map(fields, (field, fieldName) => {
    field = _.isString(field) ? { type: field } : field
    field.notNull = field.notNull ? 'NOT NULL' : ''
    field.unique = field.unique ? 'UNIQUE' : ''
    return `${fieldName} ${field.type} ${field.unique} ${field.notNull}`
  })

  const keysState = `PRIMARY KEY (${_.keys(keys).join(',')})`

  const foreignsState = _.map(foreigns, (field, fieldName) => {
    const [ table, column ] = field.foreign.split('.')
    return `FOREIGN KEY (${fieldName}) REFERENCES ${table} (${column})`
  })

  return _.concat(columnStates, keysState, foreignsState).join(',\n')
}

function solveColumnAndValue (fields, items) {
  const itemFields = _.union.apply(_, _.map(items, _.keys))
  const columns = _.intersection(fields, itemFields)

  const sqlPlaceholder = _.fill(Array(columns.length), '?').join(',')
  const valueSql = _.fill(Array(items.length), `(${sqlPlaceholder})`).join(',')
  const valueParams = _.reduce(items, (result, item) => {
    for (const column of columns) {
      result.push(item[column])
    }
    return result
  }, [])

  return {
    columns: `(${columns.join(',')})`,
    values: {
      sql: valueSql,
      params: valueParams,
    },
  }
}

function solveSelect (fields, select) {
  return {
    sql: select ? _.intersection(fields, select).join(',') : '*',
    params: [],
  }
}

function _solveWhereInner (fields, where, params = []) {
  let result
  if (!where) {
    return {
      sql: '',
      params: [],
    }
  }
  if (where.$op) {
    const op = where.$op.toLowerCase() === 'or' ? ' OR ' : ' AND '
    result = _.map(where.$conditions, item => _solveWhereInner(fields, item, params).sql).join(op)
  } else {
    result = _.map(_.pick(where, fields), (value, key) => {
      let op = '='
      if (_.isObject(value)) {
        op = value.$op || '='
        value = value.$value
      }
      params.push(value)
      return `${key} ${op} ?`
    }).join(' AND ')
  }
  return {
    sql: `(${result})`,
    params,
  }
}

function solveWhere (fields, where) {
  const result = _solveWhereInner(fields, where)
  result.sql = result.sql ? `WHERE ${result.sql}` : ''
  return result
}

function solveLimit (fields, limit) {
  return {
    sql: limit ? 'LIMIT ?' : '',
    params: limit ? [ limit ] : [],
  }
}

function solveOffset (fields, offset) {
  return {
    sql: offset ? 'OFFSET ?' : '',
    params: offset ? [ offset ] : [],
  }
}

function solveSort (fields, sort) {
  const sql = _.map(_.pick(sort, fields), (value, key) => {
    value = value.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    return `${key} ${value}`
  }).join(',')
  return {
    sql: sql ? `ORDER BY ${sql}` : '',
    params: [],
  }
}

function solveQuery (fields, query) {
  let { $select: select, $where: where, $limit: limit, $offset: offset, $sort: sort } = query
  if (!select && !where && !limit && !offset && !sort) {
    where = query
  }
  select = solveSelect(fields, select)
  where = solveWhere(fields, where)
  limit = solveLimit(fields, limit)
  offset = solveOffset(fields, offset)
  sort = solveSort(fields, sort)

  return { select, where, limit, offset, sort }
}

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
  /* eslint-disable no-eval */
  const { fields, indexes, methods } = options

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

  var tmp

  /**
   * mode.prototype.assign
   */
  const assign = eval(`tmp = function (data) {
    ${
      _.map(fields, (fieldConfig, field) => {
        return `this.${field} = data.${field}`
      }).join('\n')
    }
  }`)

  /**
   * model.init
   */
  model.init = function () {
    return new Promise((resolve, reject) => {
      // create table
      const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${
          solveFields(fields, { keys, foreigns })
        }
      )`
      app.sqlite.run(sql,
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
            app.sqlite.run(sql, err => {
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
    const { select, where, sort, limit, offset } = solveQuery(flattenFields, query)

    const sql = `SELECT ${select.sql} FROM ${tableName} ${where.sql} ${sort.sql} ${limit.sql} ${offset.sql}`
    const params = _.concat(select.params, where.params, sort.params, limit.params, offset.params)
    return new Promise((resolve, reject) => {
      app.sqlite.all(sql, params, (err, rows) => {
        err ? reject(err) : resolve(_.map(rows, row => new model(row)))
      })
    })
  }

  /**
   * model.findOne
   */
  model.findOne = function (query) {
    const { select, where, sort } = solveQuery(flattenFields, query)

    const sql = `SELECT ${select.sql} FROM ${tableName} ${where.sql} ${sort.sql}`
    const params = _.concat(select.params, where.params, sort.params)
    return new Promise((resolve, reject) => {
      app.sqlite.get(sql, params, (err, row) => {
        err ? reject(err) : resolve(row && new model(row))
      })
    })
  }

  /**
   * model.count
   */
  model.count = function (where) {
    where = solveWhere(flattenFields, where)

    const sql = `SELECT COUNT(*) FROM ${tableName} ${where.sql}`
    const params = where.params
    return new Promise((resolve, reject) => {
      app.sqlite.get(sql, params, (err, row) => {
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
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params, function (err) {
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
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params, function (err) {
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
    return new Promise((resolve, reject) => {
      app.sqlite.run(sql, params, function (err) {
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
  const update = eval(`tmp = function () {
    return model.update({${
      _.map(flattenKeys, key => {
        return `${key}: this.${key}`
      }).join(',')
    }}, {${
      _.map(_.xor(flattenKeys, flattenFields), key => {
        return `${key}: this.${key}`
      }).join(',')
    }})
  }`)

  /**
   * model.prototype.destroy
   */
  const destroy = eval(`tmp = function () {
    return model.destroy({${
      _.map(flattenKeys, key => {
        return `${key}: this.${key}`
      }).join(',')
    }})
  }`)

  /**
   * model.prototype.toObject
   */
  const toJSON = eval(`tmp = function () {
    return _.omit(this, [${
      _.compact(_.map(fields, (field, fieldName) => {
        if (field.hide) {
          return `'${fieldName}'`
        }
      })).join(',')
    }])
  }`)

  /**
   * model.prototype.toString
   */
  const toString = function () {
    return JSON.stringify(this)
  }

  model.prototype = _.create(Model.prototype, _.assign({
    constructor: model,
    assign,
    create,
    update,
    destroy,
    toJSON,
    toString,
  }), methods)

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
