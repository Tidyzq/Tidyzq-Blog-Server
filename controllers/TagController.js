const Tag = app.models.Tag
const Document = app.models.Document
const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')

module.exports = {

  /**
   * 判断标签是否存在
   */
  async hasTag (req, res, next) {
    try {
      let tag = req.data.tag
      if (!tag) {
        tag = await Tag.findOne({ id: req.params.tagId, url: req.params.tagUrl })
      }
      if (!tag) { // tag not exists
        throw new Error('tag not found.')
      }
      req.data.tag = tag
      next()
    } catch (err) {
      log.verbose(`TagController.hasTag :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取所有标签
   */
  async getTags (req, res) {
    try {
      const [ tags, count ] = await Promise.all([
        Tag.find({
          $where: req.query.where,
          $limit: req.query.limit,
          $offset: req.query.offset,
          $sort: req.query.where,
        }),
        Tag.count({ $where: req.query.where }),
      ])

      res.set('X-Total-Count', count)
      res.ok(tags)
    } catch (err) {
      log.verbose(`TagController.getTags :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取标签详情
   */
  getTag (req, res) {
    try {
      const tag = req.data.tag

      res.ok(tag)
    } catch (err) {
      log.verbose(`TagController.getTag :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 创建标签
   */
  async createTag (req, res) {
    try {
      const tag = new Tag(_.pickBy(req.body, _.identity))

      if (_.isUndefined(tag.url) && tag.name) {
        const url = await generateUrl(Tag, tag.name)
        tag.url = url
        log.verbose(`TagController :: generated url ${url}`)
      }

      tag.id = await tag.create()

      res.ok(tag)
    } catch (err) {
      log.verbose(`TagController.createTag :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 修改标签
   */
  async updateTag (req, res) {
    try {
      const value = _.pick(req.body, [ 'name', 'url' ])
      const tag = _.assign(req.data.tag, value)

      await tag.update()

      res.ok(tag)
    } catch (err) {
      log.verbose(`TagController.updateTag :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 删除标签
   */
  async deleteTag (req, res) {
    try {
      const tag = req.data.tag

      await tag.destroy()

      res.ok(tag)
    } catch (err) {
      log.verbose(`TagController.deleteTag :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取文章所有标签
   */
  async getTagsByDocument (req, res) {
    try {
      const document = req.data.document
      const [ tags, count ] = await Promise.all([
        Document.find({
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
        Document.count({
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
      ])

      res.set('X-Total-Count', count)
      res.ok(tags)
    } catch (err) {
      log.verbose(`TagController.getTagsByDocument :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 判断是否存在链接
   */
  async hasTagDocument (req, res, next) {
    try {
      let tagDocument = req.data.tagDocument
      if (!tagDocument) {
        tagDocument = await TagDocument.findOne({ tagId: req.params.tagId, documentId: req.params.documentdId })
      }
      if (!tagDocument) {
        throw new Error('tagDocument not found.')
      }
      req.data.tagDocument = tagDocument
      next()
    } catch (err) {
      log.verbose(`TagController.hasTagDocument :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取博文所有标签
   */
  async getTagsByPost (req, res) {
    try {
      const post = req.data.post
      const [ tags, count ] = await Promise.all([
        Document.find({
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
        Document.count({
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
      ])

      res.set('X-Total-Count', count)
      res.ok(tags)
    } catch (err) {
      log.verbose(`TagController.getTagsByPost :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 连接文章和许多标签
   */
  async linkDocumentWithTags (req, res) {
    try {
      const document = req.data.document
      const tags = _.isArray(req.body) ? req.body : []

      const tagDocuments = _.compact(_.map(tags, tag => {
        if (_.isInteger(tag)) {
          return new TagDocument({
            documentId: document.id,
            tagId: tag,
          })
        }
      }))

      await TagDocument.save(tagDocuments)

      res.ok(tagDocuments)
    } catch (err) {
      log.verbose(`TagController.linkDocumentWithTags :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 更新文章的所有连接
   */
  async updateLinksWithTags (req, res) {
    try {
      const document = req.data.document
      const newTags = _.isArray(req.body) ? req.body : []
      const oldTags = await Document.find({
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
      }).then(tags => tags.map(tag => tag.id))

      const unchangedTags = _.intersection(newTags, oldTags)
      _.pullAll(newTags, unchangedTags)
      _.pullAll(oldTags, unchangedTags)

      await Promise.all([
        oldTags.length && TagDocument.destroy({
          tagId: {
            $op: 'in',
            $value: oldTags,
          },
          documentId: document.id,
        }),
        newTags.length && TagDocument.create(
          _.compact(_.map(newTags, tagId => {
            if (_.isInteger(tagId)) {
              return new TagDocument({
                documentId: document.id,
                tagId,
              })
            }
          }))
        ),
      ])

      res.ok({ oldTags, newTags })
    } catch (err) {
      log.verbose(`TagController.updateLinksWithTags :: ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 删除文章标签连接
   */
  async unlinkTagDocument (req, res) {
    try {
      const tagDocument = req.data.tagDocument

      await tagDocument.destroy()

      res.ok(tagDocument)
    } catch (err) {
      log.verbose(`TagController.unlinkTagDocument :: ${err}`)
      res.badRequest(err.message)
    }
  },

}
