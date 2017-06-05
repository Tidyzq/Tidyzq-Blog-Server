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
    '/': {
      get: 'IndexController.index',
    },

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
            get: [ 'UserController.getDocumentsByUser' ],
          },
        },
      },
      '/documents': {
        get: [ 'DocumentController.getDocuments' ],
        post: [ 'AuthController.hasAccessToken', 'DocumentController.createDocument' ],
        '/:id': {
          get: [ 'DocumentController.getDocumentById' ],
          put: [ 'DocumentController.isAuthor', 'DocumentController.updateDocumentById' ],
          delete: [ 'DocumentController.isAuthor', 'DocumentController.deleteDocumentById' ],
        },
      },
    },
  },

}
