const Document = app.models.Document
const Tag = app.models.Tag
const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')

module.exports = {

  /**
   * 检查是否是文章作者
   */
  isAuthor (req, res, next) {
    try {
      const document = req.data.document
      if (!document || !req.data.auth || req.data.auth.id !== document.author) {
        throw new Error('not author of document.')
      }
      req.data.document = document
      next()
    } catch (err) {
      log.verbose(`DocumentController.isAuthor :: ${err}`)
      res.unauthorized(err.message)
    }
  },

  /**
   * 检查文章是否存在
   */
  async hasDocument (req, res, next) {
    try {
      let document = req.data.document
      if (!document) {
        document = await Document.findOne({ id: req.params.documentId })
      }
      if (!document) { // document not exists
        throw new Error('document not found.')
      }
      req.data.document = document
      next()
    } catch (err) {
      log.verbose(`DocumentController.hasDocument :: ${err}`)
      res.notFound(err.message)
    }

  },

  /**
   * 获取所有文章
   */
  async getDocuments (req, res) {
    try {
      const [ documents, count ] = await Promise.all([
        Document.find({
          $where: req.query.where,
          $limit: req.query.limit,
          $offset: req.query.offset,
          $sort: req.query.sort,
        }),
        Document.count({
          $where: req.query.where,
        }),
      ])
      res.set('X-Total-Count', count)
      res.ok(documents)
    } catch (err) {
      log.verbose(`Document.getDocuments :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取单个文章
   */
  getDocument (req, res) {
    try {
      const document = req.data.document
      res.ok(document)
    } catch (err) {
      log.verbose(`Document.getDocumentById :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 创建文章
   */
  async createDocument (req, res) {
    try {
      const document = new Document(_.assign(req.body, {
        author: req.data.auth.id,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
      }))

      if (_.isUndefined(document.url) && document.title) {
        document.url = await generateUrl(Document, document.title)
      }
      document.id = await document.create()

      res.ok(document)
    } catch (err) {
      log.verbose(`DocumentController.createDocument :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 修改文章
   */
  async updateDocument (req, res) {
    try {
      let document = req.data.document

      document = _.assign(document, _.pick(req.body, [ 'title', 'url', 'markdown', 'type' ]), {
        modifiedAt: Date.now(),
      })
      await document.update()

      res.ok(document)
    } catch (err) {
      log.verbose(`DocumentController.updateDocumentById :: ${err}\n${err.stack}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 删除文章
   */
  async deleteDocument (req, res) {
    try {
      const document = req.data.document

      await document.destroy()

      res.ok(document)
    } catch (err) {
      log.verbose(`DocumentController.deleteDocumentById :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取用户文章
   */
  async getDocumentsByUser (req, res) {
    try {
      const id = req.params.userId

      const [ documents, count ] = await Promise.all([
        Document.find({
          $where: { author: id },
          $limit: req.query.limit,
          $offset: req.query.offset,
          $sort: req.query.sort,
        }),
        Document.count({ author: id }),
      ])
      res.set('X-Total-Count', count)
      res.ok(documents)
    } catch (err) {
      log.verbose(`UserController.getDocuments :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取标签所有文章
   */
  async getDocumentsByTag (req, res) {
    try {
      const tag = req.data.tag

      const [ documents, count ] = await Promise.all([
        Tag.find({
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
        Tag.count({
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
      ])
      res.set('X-Total-Count', count)
      res.ok(documents)
    } catch (err) {
      log.verbose(`UserController.getDocuments :: ${err}`)
      res.badRequest(err.message)
    }
  },

}
