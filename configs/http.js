module.exports.http = {

  accessControl: {
    allowOrigin: '*',
    allowHeaders: 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With',
    allowMethods: 'PUT,POST,GET,DELETE,OPTIONS',
  },

  middlewares: [
    'logger',
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
        '/:id': {
          get: [ 'UserController.getUserById' ],
          put: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.updateUserById' ],
          '/documents': {
            get: [ 'AuthController.hasAccessToken', 'UserController.isSelf', 'UserController.getDocumentsByUser' ],
          },
          // '/posts': {
          //   get: [ 'UserController.getPostsByUser' ],
          // },
        },
      },
      '/documents': {
        post: [ 'AuthController.hasAccessToken', 'DocumentController.createDocument' ],
        '/:id': {
          get: [ 'AuthController.hasAccessToken', 'DocumentController.isAuthor', 'DocumentController.getDocumentById' ],
          put: [ 'AuthController.hasAccessToken', 'DocumentController.isAuthor', 'DocumentController.updateDocumentById' ],
          delete: [ 'AuthController.hasAccessToken', 'DocumentController.isAuthor', 'DocumentController.deleteDocumentById' ],
        },
      },
      // '/posts': {
      //   get: [ 'PostController.getPosts' ],
      //   '/url/:url': {
      //     get: [ 'PostController.getPostByUrl' ],
      //   },
      //   '/id/:id': {
      //     get: [ 'PostController.getPostById' ],
      //   },
      // },
      // '/pages/url/:url': {
      //   get: [ 'PageController.getPageByUrl' ],
      // },
    },
  },

}
