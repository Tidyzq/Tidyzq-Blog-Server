const _ = require('lodash')
const Document = require('./document')

function Page (data) {
  Document.call(this, data)
  this.type = 'page'
}

function solveQuery (query) {
  if (!_.has(query, '$where')) {
    query = { $where: query }
  }
  query.$where = solveWhere(query.$where)
  return query
}

function solveWhere (where) {
  return {
    $op: 'and',
    $conditions: [{ type: 'page' }, where ],
  }
}

function solveSet (set) {
  return _.omit(set, [ 'type' ])
}

Page.init = function () {
  return Promise.resolve()
}

Page.find = function (query) {
  return Document.find(solveQuery(query))
}

Page.findOne = function (query) {
  return Document.findOne(solveQuery(query))
}

Page.count = function (where) {
  return Document.count(solveWhere(where))
}

Page.update = function (where, set) {
  return Document.count(solveWhere(where), solveSet(set))
}

Page.destroy = function (where) {
  return Document.destroy(solveWhere(where))
}

Page.create = function (items) {
  return Document.create(_.map(items, item => {
    item.type = 'page'
    return item
  }))
}

const create = function () {
  return Page.create([ this ])
}

const destroy = function () {
  return Page.destroy({ id: this.id })
}

const update = function () {
  return Page.update({ id: this.id }, this)
}

Page.prototype = _.create(Document.prototype, {
  create,
  destroy,
  update,
})

module.exports = Page
