const Tag = app.models.Tag
const Document = app.models.Document
const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')
const Promise = require('bluebird')

module.exports = {

  /**
   * 判断标签是否存在
   */
  hasTag (req, res, next) {
    Promise.resolve(req.data.tag)
    .then(tag => {
      return tag || Tag.findOne({ id: req.params.tagId, url: req.params.tagUrl })
    })
    .then(tag => {
      if (!tag) {
        throw new Error('tag not found.')
      }
      req.data.tag = tag
      next()
    })
    .catch(err => {
      log.verbose(`TagController.hasTag :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取所有标签
   */
  getTags (req, res) {

    Promise.props({
      tags: Tag.find({
        $where: req.query.where,
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.where,
      }),
      count: Tag.count({ $where: req.query.where }),
    })
      .then(({ tags, count }) => {
        res.set('X-Total-Count', count)
        res.ok(tags)
      })
      .catch(err => {
        log.verbose(`TagController.getTags :: ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 获取标签详情
   */
  getTag (req, res) {

    Promise.resolve(req.data.tag)
      .then(tag => {
        res.ok(tag)
      })
      .catch(err => {
        log.verbose(`TagController.getTag :: ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 创建标签
   */
  createTag (req, res) {
    const tag = new Tag(req.body)

    return Promise.resolve()
      .then(() => {
        if (_.isUndefined(tag.url) && tag.name) {
          return generateUrl(Tag, tag.name)
            .then(url => {
              tag.url = url
              log.verbose(`TagController :: generated url ${url}`)
            })
        }
      })
      .then(() => tag.create())
      .then(id => {
        tag.id = id
      })
      .then(() => {
        res.ok(tag)
      })
      .catch(err => {
        log.verbose(`TagController.createTag :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 修改标签
   */
  updateTag (req, res) {
    const value = _.pick(req.body, [ 'name', 'url' ])

    Promise.resolve(req.data.tag)
      .then(tag => {
        tag = _.assign(tag, value)
        return tag.update().then(() => tag)
      })
      .then(tag => {
        res.ok(tag)
      })
      .catch(err => {
        log.verbose(`TagController.updateTag :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 删除标签
   */
  deleteTag (req, res) {

    Promise.resolve(req.data.tag)
      .then(tag => {
        return tag.destroy().then(() => tag)
      })
      .then(tag => {
        res.ok(tag)
      })
      .catch(err => {
        log.verbose(`TagController.deleteTag :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 获取文章所有标签
   */
  getTagsByDocument (req, res) {
    const document = req.data.document

    return Promise.props({
      tags: Document.find({
        $where: { id: document.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from: 'documentId',
            to: 'tagId',
          },
          target: Tag,
          limit: req.query.limit,
          offset: req.query.offset,
          sort: req.query.sort,
        },
      }),
      count: Document.count({
        $where: { id: document.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from: 'documentId',
            to: 'tagId',
          },
          target: Tag,
        },
      }),
    })
      .then(({ tags, count }) => {
        res.set('X-Total-Count', count)
        res.ok(tags)
      })
      .catch(err => {
        log.verbose(`TagController.getTagsByDocument :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 判断是否存在链接
   */
  hasTagDocument (req, res, next) {
    Promise.resolve(req.data.tagDocument)
    .then(tagDocument => {
      return tagDocument || TagDocument.findOne({ tagId: req.params.tagId, documentId: req.params.documentdId })
    })
    .then(tagDocument => {
      if (!tagDocument) {
        throw new Error('tagDocument not found.')
      }
      req.data.tagDocument = tagDocument
      next()
    })
    .catch(err => {
      log.verbose(`TagController.hasTagDocument :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取博文所有标签
   */
  getTagsByPost (req, res) {
    const post = req.data.post

    Promise.props({
      tags: Document.find({
        $where: { id: post.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from: 'documentId',
            to: 'tagId',
          },
          target: Tag,
          limit: req.query.limit,
          offset: req.query.offset,
          sort: req.query.sort,
        },
      }),
      count: Document.count({
        $where: { id: post.id },
        $join: {
          from: 'id',
          to: 'id',
          through: {
            model: TagDocument,
            from: 'documentId',
            to: 'tagId',
          },
          target: Tag,
        },
      }),
    })
      .then(({ tags, count }) => {
        res.set('X-Total-Count', count)
        res.ok(tags)
      })
      .catch(err => {
        log.verbose(`TagController.getTagsByPost :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 连接文章和许多标签
   */
  linkDocumentWithTags (req, res) {
    const document = req.data.document

    Promise.resolve(req.body)
      .then(tags => {
        return _.isArray(tags) ? tags : []
      })
      .then(tags => {
        return _.compact(_.map(tags, tag => {
          if (_.isInteger(tag)) {
            return new TagDocument({
              documentId: document.id,
              tagId: tag,
            })
          }
        }))
      })
      .then(tagdocuments => {
        return TagDocument.save(tagdocuments).then(() => tagdocuments)
      })
      .then(tagdocuments => {
        res.ok(tagdocuments)
      })
      .catch(err => {
        log.verbose(`TagController.linkDocumentWithTags :: ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 删除文章标签连接
   */
  unlinkTagDocument (req, res) {
    const tagDocument = req.data.tagDocument

    tagDocument.destroy()
    .then(() => {
      res.ok(tagDocument)
    })
    .catch(err => {
      log.verbose(`TagController.unlinkTagDocument :: ${err}`)
      res.badRequest(err.message)
    })
  },

}
