const Page = app.models.Page

module.exports = {

  /**
   * 根据url获取页面详情
   */
  getPageByUrl (req, res, next) {
    const url = req.params.url

    Page.findOne({ url })
      .then(page => {
        if (!page) {
          throw new Error('page not found')
        }
        return page
      })
      .then(page => {
        res.ok(page)
      })
      .catch(err => {
        app.log.verbose(`PageController :: getPageById ${err}`)
        res.notFound(err.message)
      })
  },

}
