const _ = require('lodash')
const Document = require('./document')

function Post (data) {
  Document.call(this, data)
  this.type = 'post'
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
    $conditions: [{ type: 'post' }, where ],
  }
}

function solveSet (set) {
  return _.omit(set, [ 'type' ])
}

Post.init = function () {
  return Promise.resolve()
}

Post.find = function (query) {
  return Document.find(solveQuery(query))
}

Post.findOne = function (query) {
  return Document.findOne(solveQuery(query))
}

Post.count = function (where) {
  return Document.count(solveWhere(where))
}

Post.update = function (where, set) {
  return Document.count(solveWhere(where), solveSet(set))
}

Post.destroy = function (where) {
  return Document.destroy(solveWhere(where))
}

Post.create = function (items) {
  return Document.create(_.map(items, item => {
    item.type = 'post'
    return item
  }))
}

const create = function () {
  return Post.create([ this ])
}

const destroy = function () {
  return Post.destroy({ id: this.id })
}

const update = function () {
  return Post.update({ id: this.id }, this)
}

Post.prototype = _.create(Document.prototype, {
  create,
  destroy,
  update,
})

module.exports = Post
