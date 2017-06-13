module.exports.http = {

  accessControl: {
    allowOrigin: '*',
    allowHeaders: 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With',
    allowMethods: 'PUT,POST,GET,DELETE,OPTIONS',
  },

  middlewares: [
    'logger',
    'requestData',
    'response',
    'accessControl',
    'cookieParser',
    'bodyParser',
    'passport',
    'powerdBy',
    // 'favicon',
    'static',
    'httpRouter',
    '404',
    '500',
  ],

  routes: {
    '/api': {
      '/auth': {
        '/register': {
          post: 'AuthController.register',
        },
        '/login': {
          post: 'AuthController.login',
        },
      },
      '/users': {
        get: [ 'AuthController.hasAccessToken', 'UserController.getUsers' ],
        '/:userId': {
          get: [ 'UserController.hasUser', 'UserController.getUserById' ],
          put: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.hasUser', 'UserController.updateUserById' ],
          '/documents': {
            get: [ 'AuthController.hasAccessToken', 'UserController.hasUser', 'DocumentController.getDocumentsByUser' ],
          },
          '/posts': {
            get: [ 'UserController.hasUser', 'PostController.getPostsByUser' ],
          },
        },
      },
      '/documents': {
        post: [ 'AuthController.hasAccessToken', 'DocumentController.createDocument' ],
        '/:documentId': {
          get: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.getDocumentById' ],
          put: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.updateDocumentById' ],
          delete: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.deleteDocumentById' ],
          '/tags': {
            get: [ 'AuthorController.hasAccessToken', 'DocumentController.hasDocument', 'TagController.getTagsByDocument' ],
            post: [ 'AuthorController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'TagController.linkDocumentWithTags' ],
            '/:tagId': {
              delete: [ 'AuthorController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'TagController.unlinkTagDocument' ],
            },
          },
        },
      },
      '/tags': {
        post: [ 'AuthorController.hasAccessToken' ],
      },
      '/posts': {
        get: [ 'PostController.getPosts' ],
        '/url/:postUrl': {
          get: [ 'PostController.getPostByUrl' ],
        },
        '/id/:postId': {
          get: [ 'PostController.getPostById' ],
        },
      },
      '/pages/url/:pageUrl': {
        get: [ 'PageController.getPageByUrl' ],
      },
    },
  },

}
