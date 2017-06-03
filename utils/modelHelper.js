const _ = require('lodash')
// const Promise = require('bluebird')

function solveSelect (select) {
  return {
    sql: select ? select.join(',') : '*',
    params: [],
  }
}

function solveWhereInner (where, params = []) {
  let result
  if (!where) {
    return {
      sql: '',
      params: [],
    }
  }
  if (where.$op) {
    const op = where.$op === 'or' ? ' OR ' : ' AND '
    result = _.map(where.$conditions, item => solveWhereInner(item, params).sql).join(op)
  } else {
    result = _.map(where, (value, key) => {
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

function solveWhere (where) {
  const result = solveWhereInner(where)
  result.sql = result.sql ? `WHERE ${result.sql}` : ''
  return result
}

function solveLimit (limit) {
  return {
    sql: limit ? 'LIMIT ?' : '',
    params: limit ? [ limit ] : '',
  }
}

function solveOffset (offset) {
  return {
    sql: offset ? 'OFFSET ?' : '',
    params: offset ? [ offset ] : '',
  }
}

function solveSort (sort) {
  return {
    sql: sort ? `ORDER BY ${sort.join(',')}` : '',
    params: [],
  }
}

function solveQuery (query) {
  let { $select: select, $where: where, $limit: limit, $offset: offset, $sort: sort } = query
  if (!select && !where && !limit && !offset && !sort) {
    where = query
  }
  select = solveSelect(select)
  where = solveWhere(where)
  limit = solveLimit(limit)
  offset = solveOffset(offset)
  sort = solveSort(sort)

  return { select, where, limit, offset, sort }
}

function solveSet (set) {
  const params = []
  const sql = _.without(_.map(set, (value, key) => {
    if (_.isUndefined(value) || _.isNull(value)) {
      params.push(key)
      return `${key} = ?`
    }
  })).join(',')
  return {
    sql: `(${sql})`,
    params,
  }
}

exports.solveSelect = solveSelect

exports.solveWhere = solveWhere

exports.solveLimit = solveLimit

exports.solveOffset = solveOffset

exports.solveSort = solveSort

exports.solveQuery = solveQuery

exports.solveSet = solveSet
