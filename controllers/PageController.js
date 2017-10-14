const Page = app.models.Page

module.exports = {

  /**
   * 判断页面是否存在
   */
  async hasPage (req, res, next) {
    try {
      let page = req.data.page
      if (!page) {
        page = await Page.findOne({ id: req.params.pageId, url: req.params.pageUrl })
      }
      if (!page) { // page not exists
        throw new Error('page not found.')
      }
      req.data.page = page
      next()
    } catch (err) {
      log.verbose(`PageController.hasPage :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取页面详情
   */
  getPage (req, res) {
    try {
      const page = req.data.page

      res.ok(page)
    } catch (err) {
      app.log.verbose(`PageController :: getPage ${err}`)
      res.notFound(err.message)
    }
  },

}
