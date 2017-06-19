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
        '/login': {
          post: 'AuthController.login',
        },
      },
      '/users': {
        get: [ 'AuthController.hasAccessToken', 'UserController.getUsers' ],
        post: [ 'AuthController.hasAccessToken', 'UserController.createUser' ],
        '/:userId': {
          get: [ 'UserController.hasUser', 'UserController.getUser' ],
          put: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.hasUser', 'UserController.updateUser' ],
          delete: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.hasUser', 'UserController.deleteUser' ],
          '/password': {
            put: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.hasUser', 'UserController.updateUserPassword' ],
          },
          '/posts': {
            get: [ 'UserController.hasUser', 'PostController.getPostsByUser' ],
          },
        },
      },
      '/documents': {
        get: [ 'AuthController.hasAccessToken', 'DocumentController.getDocuments' ],
        post: [ 'AuthController.hasAccessToken', 'DocumentController.createDocument' ],
        '/:documentId': {
          get: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.getDocument' ],
          put: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.updateDocument' ],
          delete: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'DocumentController.deleteDocument' ],
          '/tags': {
            get: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'TagController.getTagsByDocument' ],
            post: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'TagController.linkDocumentWithTags' ],
            '/:tagId': {
              delete: [ 'AuthController.hasAccessToken', 'DocumentController.hasDocument', 'DocumentController.isAuthor', 'TagController.hasTagDocument', 'TagController.unlinkTagDocument' ],
            },
          },
        },
      },
      '/tags': {
        get: [ 'AuthController.hasAccessToken', 'TagController.getTags' ],
        post: [ 'AuthController.hasAccessToken', 'TagController.createTag' ],
        '/id/:tagId': {
          get: [ 'AuthController.hasAccessToken', 'TagController.hasTag', 'TagController.getTag' ],
          put: [ 'AuthController.hasAccessToken', 'TagController.hasTag', 'TagController.updateTag' ],
          delete: [ 'AuthController.hasAccessToken', 'TagController.hasTag', 'TagController.deleteTag' ],
          '/documents': {
            get: [ 'AuthController.hasAccessToken', 'TagController.hasTag', 'DocumentController.getDocumentsByTag' ],
          },
        },
        '/url/:tagUrl': {
          get: [ 'TagController.hasTag', 'TagController.getTag' ],
          '/posts': {
            get: [ 'TagController.hasTag', 'PostController.getPostsByTag' ],
          },
        },
      },
      '/posts': {
        get: [ 'PostController.getPosts' ],
        '/:postUrl': {
          get: [ 'PostController.hasPost', 'PostController.getPost' ],
          '/tags': {
            get: [ 'PostController.hasPost', 'TagController.getTagsByPost' ],
          },
        },
      },
      '/pages/:pageUrl': {
        get: [ 'PageController.hasPage', 'PageController.getPage' ],
      },
    },
  },

}
