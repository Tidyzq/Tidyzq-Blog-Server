const Tag = app.models.Tag
// const Document = app.models.Document
// const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')

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

    Tag.find()
      .then(tags => {
        return Tag.count()
          .then(count => {
            res.set('X-Total-Count', count)
            res.ok(tags)
          })
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
          return generateUrl(Tag, tag.title)
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

}
