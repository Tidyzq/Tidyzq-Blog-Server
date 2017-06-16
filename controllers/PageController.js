const Page = app.models.Page

module.exports = {

  /**
   * 判断页面是否存在
   */
  hasPage (req, res, next) {

    Promise.resolve(req.data.page)
    .then(page => {
      return page || Page.findOne({ id: req.params.pageId, url: req.params.pageUrl })
    })
    .then(page => {
      if (!page) {
        throw new Error('page not found.')
      }
      req.data.page = page
      next()
    })
    .catch(err => {
      log.verbose(`PageController.hasPage :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取页面详情
   */
  getPage (req, res) {

    Promise.resolve(req.data.page)
    .then(page => {
      res.ok(page)
    })
    .catch(err => {
      app.log.verbose(`PageController :: getPage ${err}`)
      res.notFound(err.message)
    })
  },

}
