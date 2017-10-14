const Post = app.models.Post
const Document = app.models.Document
const Tag = app.models.Tag
const TagDocument = app.models.TagDocument

module.exports = {

  /**
   * 判断页面是否存在
   */
  async hasPost (req, res, next) {
    try {
      let post = req.data.post
      if (!post) {
        post = await Post.findOne({ id: req.params.postId, url: req.params.postUrl })
      }
      if (!post) {
        return res.notFound('post not found.')
      }
      req.data.post = post
      next()
    } catch (err) {
      log.verbose(`PostController.hasPost :: ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取全部博文
   */
  async getPosts (req, res) {
    try {
      const [ posts, count ] = await Promise.all([
        Post.find({
          $limit: req.query.limit,
          $offset: req.query.offset,
          $sort: req.query.sort,
        }),
        Post.count(),
      ])

      res.set('X-Total-Count', count)
      res.ok(posts)
    } catch (err) {
      app.log.verbose(`PostController :: getPosts ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取用户全部博文
   */
  async getPostsByUser (req, res) {
    try {
      const id = req.params.userId

      const [ posts, count ] = await Promise.all([
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

      res.set('X-Total-Count', count)
      res.ok(posts)
    } catch (err) {
      log.verbose(`PostController :: getPostsByUser ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 获取博文详情
   */
  getPost (req, res) {
    try {
      const post = req.data.post

      res.ok(post)
    } catch (err) {
      app.log.verbose(`PostController :: getPostById ${err}`)
      res.notFound(err.message)
    }
  },

  /**
   * 获取标签所有博文
   */
  async getPostsByTag (req, res) {
    try {
      const tag = req.data.tag

      const [ posts, count ] = await Promise.all([
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

      res.set('X-Total-Count', count)
      res.ok(posts)
    } catch (err) {
      app.log.verbose(`PostController :: getPostsByTag ${err}`)
      res.notFound(err.message)
    }
  },

}
