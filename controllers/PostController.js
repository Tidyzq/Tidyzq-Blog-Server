const Post = app.models.Post
const Document = app.models.Document
const Tag = app.models.Tag
const TagDocument = app.models.TagDocument

module.exports = {

  /**
   * 判断页面是否存在
   */
  hasPost (req, res, next) {

    Promise.resolve(req.data.post)
    .then(post => {
      return post || Post.findOne({ id: req.params.postId, url: req.params.postUrl })
    })
    .then(post => {
      if (!post) {
        throw new Error('post not found.')
      }
      req.data.post = post
      next()
    })
    .catch(err => {
      log.verbose(`PostController.hasPost :: ${err}`)
      res.notFound(err.message)
    })
  },

  /**
   * 获取全部博文
   */
  getPosts (req, res) {
    Promise.all([
      Post.find({
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.sort,
      }),
      Post.count(),
    ])
    .then(([ posts, count ]) => {
      res.set('X-Total-Count', count)
      res.ok(posts)
    })
    .catch(err => {
      app.log.verbose(`PostController :: getPosts ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取用户全部博文
   */
  getPostsByUser (req, res) {
    const id = req.params.userId

    Promise.all([
      Post.find({
        $where: { author: id },
        $limit: req.query.limit,
        $offset: req.query.offset,
        $sort: req.query.sort,
      }),
      Post.count({
        author: id,
      }),
    ])
    .then(([ posts, count ]) => {
      res.set('X-Total-Count', count)
      res.ok(posts)
    })
    .catch(err => {
      app.log.verbose(`PostController :: getPostsByUser ${err}`)
      res.badRequest(err.message)
    })
  },

  /**
   * 获取博文详情
   */
  getPost (req, res) {

    Promise.resolve(req.data.post)
    .then(post => {
      return post || Post.findOne({ id: req.params.postId, url: req.params.postUrl })
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
   * 获取标签所有博文
   */
  getPostsByTag (req, res) {

    Promise.resolve(req.data.tag)
    .then(tag => {
      return Promise.all([
        Tag.find({
          $where: { id: tag.id },
          $join: {
            from: 'id',
            to: 'id',
            through: {
              model: TagDocument,
              from: 'tagId',
              to: 'documentId',
            },
            target: Document,
            where: {
              type: 'post',
            },
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
              from: 'tagId',
              to: 'documentId',
            },
            target: Document,
            where: {
              type: 'post',
            },
          },
        }),
      ])
    })
    .then(([ posts, count ]) => {
      res.set('X-Total-Count', count)
      res.ok(posts)
    })
    .catch(err => {
      app.log.verbose(`PostController :: getPostsByTag ${err}`)
      res.notFound(err.message)
    })
  },

}
