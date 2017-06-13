const Tag = app.models.Tag
// const Document = app.models.Document
// const TagDocument = app.models.TagDocument
const { generateUrl } = require('../utils/urlHelper')

module.exports = {

  // getTagsByDocument (req, res) {

  // },

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
