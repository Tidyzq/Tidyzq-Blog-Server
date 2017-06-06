const Post = app.models.post

module.exports = {

  /**
   * 获取全部博文
   */
  getPosts (req, res, next) {
    Post.find({
      $limit: req.query.limit,
      $offset: req.query.offset,
      $sort: req.query.sort,
    })
    .then(posts => {
      return Post.count()
        .then(count => {
          res.set('X-Total-Count', count)
          res.ok(posts)
        })
    })
    .catch(err => {
      app.log.verbose(`PostController :: getPosts ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取用户全部博文
   */
  getPostsByUser (req, res, next) {
    const id = req.params.id

    Post.find({
      $where: { author: id },
      $limit: req.query.limit,
      $offset: req.query.offset,
      $sort: req.query.sort,
    })
    .then(posts => {
      return Post.count({ author: id })
        .then(count => {
          res.set('X-Total-Count', count)
          res.ok(posts)
        })
    })
    .catch(err => {
      app.log.verbose(`PostController :: getPostsByUser ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 根据Id获取博文详情
   */
  getPostById (req, res, next) {
    const id = req.params.id

    Post.findOne({ id })
      .then(post => {
        if (!post) {
          throw new Error('post not found')
        }
        return post
      })
      .then(post => {
        res.ok(post)
      })
      .catch(err => {
        app.log.verbose(`PostController :: getPostById ${err}`)
        res.notFound(err.message)
      })
  },

  /**
   * 根据url获取博文详情
   */
  getPostByUrl (req, res, next) {
    const url = req.params.url

    Post.findOne({ url })
      .then(post => {
        if (!post) {
          throw new Error('post not found')
        }
        return post
      })
      .then(post => {
        res.ok(post)
      })
      .catch(err => {
        app.log.verbose(`PostController :: getPostById ${err}`)
        res.notFound(err.message)
      })
  },

}
