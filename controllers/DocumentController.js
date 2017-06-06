const Document = app.models.Document
const { generateUrl } = require('../utils/urlHelper')

module.exports = {

  /**
   * 检查是否是文章作者
   */
  isAuthor (req, res, next) {
    const id = req.params.id

    Document.findOne({ id })
      .then(document => {
        if (!document || !req.user || req.user.id !== document.author) {
          throw new Error('not author.')
        }
      })
      .then(next)
      .catch(err => {
        log.verbose(`DocumentController.isAuthor :: ${err}`)
        res.unauthorized(err.message)
      })
  },

  /**
   * 获取所有文章
   */
  getDocuments (req, res, next) {
    Document.find({
      $where: req.query.where,
      $limit: req.query.limit,
      $offset: req.query.offset,
      $sort: req.query.sort,
    })
    .then(documents => {
      return Document.count(req.query.where)
        .then(count => {
          res.set('X-Total-Count', count)
          res.ok(documents)
        })
    })
    .catch(err => {
      log.verbose(`Document.getDocuments :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取单个文章
   */
  getDocumentById (req, res, next) {
    const id = req.params.id

    Document.findOne({ id })
      .then(document => {
        res.ok(document)
      })
      .catch(err => {
        log.verbose(`Document.getDocumentById :: ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 创建文章
   */
  createDocument (req, res, next) {
    const document = new Document(_.assign(req.body, {
      author: req.user.id,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    }))

    return Promise.resolve()
      .then(() => {
        if (_.isUndefined(document.url) && document.title) {
          return generateUrl(Document, document.title)
            .then(url => {
              document.url = url
              log.verbose(`DocumentController :: generated url ${url}`)
            })
        }
      })
      .then(() => document.create())
      .then(id => {
        document.id = id
      })
      .then(() => {
        res.ok(document)
      })
      .catch(err => {
        log.verbose(`DocumentController.createDocument :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 修改文章
   */
  updateDocumentById (req, res, next) {
    const id = req.params.id

    Document.findOne({ id })
      .then(document => {
        if (!document) {
          throw new Error('document not found.')
        }
        return document
      })
      .then(document => {
        document = _.assign(document, _.pick(req.body, [ 'title', 'url', 'markdown' ]), {
          modifiedAt: Date.now(),
        })
        return document.update().then(() => document)
      })
      .then(document => {
        res.ok(document)
      })
      .catch(err => {
        log.verbose(`DocumentController.updateDocumentById :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 删除文章
   */
  deleteDocumentById (req, res, next) {
    const id = req.params.id

    Document.findOne({ id })
      .then(document => {
        if (!document) {
          throw new Error('document not found.')
        }
        return document
      })
      .then(document => {
        return document.destroy().then(() => document)
      })
      .then(document => {
        res.ok(document)
      })
      .catch(err => {
        log.verbose(`DocumentController.deleteDocumentById :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 获取用户文章
   */
  getDocumentsByUser (req, res, next) {
    const id = req.params.id

    Document.find({
      $where: { author: id },
      $limit: req.query.limit,
      $offset: req.query.offset,
      $sort: req.query.sort,
    })
    .then(documents => {
      return Document.count({ author: id })
        .then(count => {
          res.set('X-Total-Count', count)
          res.ok(documents)
        })
    })
    .catch(err => {
      log.verbose(`UserController.getDocuments :: ${err}`)
      res.badRequest(err.message)
    })
  },

}
