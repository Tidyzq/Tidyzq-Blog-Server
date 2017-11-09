
exports.http = {

  accessControl: {
    allowOrigin: '*',
    allowHeaders: 'Content-Type,Content-Length,Authorization,Accept,X-Requested-With',
    allowMethods: 'PUT,POST,GET,DELETE,OPTIONS',
  },

  get middlewares () {
    return [
      require('../middlewares/logger'),
      require('../middlewares/requestData'),
      require('../middlewares/response'),
      require('../middlewares/accessControl'),
      require('../middlewares/jsonParser'),
      require('../middlewares/passport'),
      require('../middlewares/poweredBy'),
      // require('../middlewares/favicon'),
      require('../middlewares/static'),
      require('../middlewares/httpRouter'),
      require('../middlewares/404'),
      require('../middlewares/500'),
    ]
  },

  get routes () {
    const AuthController = require('../controllers/AuthController')
    const CosController = require('../controllers/CosController')
    const DocumentController = require('../controllers/DocumentController')
    const PageController = require('../controllers/PageController')
    const PostController = require('../controllers/PostController')
    const SettingController = require('../controllers/SettingController')
    const TagController = require('../controllers/TagController')
    const UserController = require('../controllers/UserController')
    return {
      '/api': {
        '/auth': {
          '/login': {
            POST: [ AuthController.login ],
          },
          '/check-login': {
            GET: [ AuthController.hasAccessToken, AuthController.checkLogin ],
          },
        },
        '/users': {
          GET: [ AuthController.hasAccessToken, UserController.getUsers ],
          POST: [ AuthController.hasAccessToken, UserController.createUser ],
          '/:userId': {
            GET: [ UserController.hasUser, UserController.getUser ],
            PUT: [ AuthController.hasAccessToken, UserController.isSelf, UserController.hasUser, UserController.updateUser ],
            DELETE: [ AuthController.hasAccessToken, UserController.isSelf, UserController.hasUser, UserController.deleteUser ],
            '/password': {
              PUT: [ AuthController.hasAccessToken, UserController.isSelf, UserController.hasUser, UserController.updateUserPassword ],
            },
            '/posts': {
              GET: [ UserController.hasUser, PostController.getPostsByUser ],
            },
          },
        },
        '/documents': {
          ALL: AuthController.hasAccessToken,
          GET: DocumentController.getDocuments,
          POST: DocumentController.createDocument,
          '/:documentId': {
            ALL: DocumentController.hasDocument,
            GET: DocumentController.getDocument,
            PUT: [ DocumentController.isAuthor, DocumentController.updateDocument ],
            DELETE: [ DocumentController.isAuthor, DocumentController.deleteDocument ],
            '/tags': {
              GET: TagController.getTagsByDocument,
              POST: [ DocumentController.isAuthor, TagController.linkDocumentWithTags ],
              PUT: [ DocumentController.isAuthor, TagController.updateLinksWithTags ],
              '/:tagId': {
                DELETE: [ DocumentController.isAuthor, TagController.hasTagDocument, TagController.unlinkTagDocument ],
              },
            },
          },
        },
        '/tags': {
          GET: [ AuthController.hasAccessToken, TagController.getTags ],
          POST: [ AuthController.hasAccessToken, TagController.createTag ],
          '/id/:tagId': {
            GET: [ AuthController.hasAccessToken, TagController.hasTag, TagController.getTag ],
            PUT: [ AuthController.hasAccessToken, TagController.hasTag, TagController.updateTag ],
            DELETE: [ AuthController.hasAccessToken, TagController.hasTag, TagController.deleteTag ],
            '/documents': {
              GET: [ AuthController.hasAccessToken, TagController.hasTag, DocumentController.getDocumentsByTag ],
            },
          },
          '/url/:tagUrl': {
            GET: [ TagController.hasTag, TagController.getTag ],
            '/posts': {
              GET: [ TagController.hasTag, PostController.getPostsByTag ],
            },
          },
        },
        '/posts': {
          GET: [ PostController.getPosts ],
          '/:postUrl': {
            GET: [ PostController.hasPost, PostController.getPost ],
            '/tags': {
              GET: [ PostController.hasPost, TagController.getTagsByPost ],
            },
          },
        },
        '/pages/:pageUrl': {
          GET: [ PageController.hasPage, PageController.getPage ],
        },
        '/cos/token': {
          GET: [ AuthController.hasAccessToken, CosController.getToken ],
        },
        '/settings': {
          GET: [ SettingController.getSettings ],
          PUT: [ AuthController.hasAccessToken, SettingController.updateSettings ],
        },
      },
    }
  },
}
