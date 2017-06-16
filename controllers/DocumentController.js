const Document = app.models.Document
const Tag = app.models.Tag
const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')
const Promise = require('bluebird')

module.exports = {

  /**
   * 检查是否是文章作者
   */
  isAuthor (req, res, next) {

    Promise.resolve(req.data.document)
    .then(document => {
      if (!document || !req.data.auth || req.data.auth.id !== document.author) {
        throw new Error('not author of document.')
      }
      req.data.document = document
      next()
    })
    .catch(err => {
      log.verbose(`DocumentController.isAuthor :: ${err}`)
      res.unauthorized(err.message)
    })
  },

  /**
   * 检查文章是否存在
   */
  hasDocument (req, res, next) {

    Promise.resolve(req.data.document)
    .then(document => {
      if (!document) {
        throw new Error('document not found.')
      }
      req.data.document = document
      next()
    })
    .catch(err => {
      log.verbose(`DocumentController.hasDocument :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取所有文章
   */
  getDocuments (req, res) {

    Promise.props({
      documents: Document.find({
        $where: req.query.where,
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.sort,
      }),
      count: Document.count({
        $where: req.query.where,
      }),
    })
    .then(({ documents, count }) => {
      res.set('X-Total-Count', count)
      res.ok(documents)
    })
    .catch(err => {
      log.verbose(`Document.getDocuments :: ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取单个文章
   */
  getDocument (req, res) {

    Promise.resolve(req.data.document)
      .then(document => {
        res.ok(document)
      })
      .catch(err => {
        log.verbose(`Document.getDocumentById :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 创建文章
   */
  createDocument (req, res) {
    const document = new Document(_.assign(req.body, {
      author: req.data.auth.id,
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
  updateDocument (req, res) {

    Promise.resolve(req.data.document)
      .then(document => {
        document = _.assign(document, _.pick(req.body, [ 'title', 'url', 'markdown', 'type' ]), {
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
  deleteDocument (req, res) {

    Promise.resolve(req.data.document)
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
  getDocumentsByUser (req, res) {
    const id = req.params.userId

    Promise.props({
      documents: Document.find({
        $where: { author: id },
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.sort,
      }),
      count: Document.count({ author: id }),
    })
    .then(({ documents, count }) => {
      res.set('X-Total-Count', count)
      res.ok(documents)
    })
    .catch(err => {
      log.verbose(`UserController.getDocuments :: ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取标签所有文章
   */
  getDocumentsByTag (req, res) {
    const tag = req.data.tag

    Promise.props({
      documents: Tag.find({
        $where: { id: tag.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from:  'tagId',
            to: 'documentId',
          },
          target: Document,
          limit: req.query.limit,
          offset: req.query.offset,
          sort: req.query.sort,
        },
      }),
      count: Tag.count({
        $where: { id: tag.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from:  'tagId',
            to: 'documentId',
          },
          target: Document,
        },
      }),
    })
    .then(({ documents, count }) => {
      res.set('X-Total-Count', count)
      res.ok(documents)
    })
    .catch(err => {
      log.verbose(`UserController.getDocuments :: ${err}`)
      res.badRequest(err.message)
    })
  },

}
