const express = require('express')
const path = require('path')
const http = require('http')

const Promise = require('bluebird')
const _ = require('lodash')
const includeAll = Promise.promisifyAll(require('include-all'))
const sqlite = require('sqlite3').verbose()

const CWD = process.cwd()

class App {

  constructor () {
    this.app = express()
  }

  loadConfigs (overrideConfigs) {
    // set working path
    this.app.set('path', process.cwd())

    // load custom configs
    const customConfigs = includeAll.aggregate({
      dirname: path.join(CWD, 'configs'),
      excludeDirs: /^env$/,
      filter: /(.+)\.js$/,
    })

    // load env configs
    const envConfigs = includeAll({
      dirname: path.join(CWD, 'configs', 'env'),
    })

    overrideConfigs = overrideConfigs || {}

    return Promise
      .props({
        customConfigs,
        envConfigs,
        overrideConfigs,
      })
      .then(configs => {
        const env = configs.overrideConfigs.env || configs.customConfigs.env || this.app.get('env')
        // select env config
        configs.envConfigs = configs.envConfigs[env]
        // merge configs
        configs = _.merge(configs.customConfigs, configs.envConfigs, configs.overrideConfigs)
        // apply config settings
        for (var moduleName in configs) {
          this.app.set(moduleName, configs[moduleName])
        }
        return configs
      })

  }

  loadConfigFromDirectory (dirname) {
    return includeAll({
      dirname: path.join(CWD, dirname),
      filter: /(.+)\.js$/,
    })
  }

  loadControllers () {
    const controllers = this.loadConfigFromDirectory('controllers')
    this.app.controllers = controllers
    return controllers
  }

  loadModels () {
    const models = this.loadConfigFromDirectory('models')
    this.app.models = models
    return models
  }

  loadServices () {
    const services = this.loadConfigFromDirectory('services')
    this.app.services = services
    return services
  }

  loadMiddlewares () {
    const middlewares = this.loadConfigFromDirectory('middlewares')
    this.app.middlewares = middlewares
    return middlewares
  }

  loadGlobals () {
    const globalConfig = this.app.get('globals')

    if (!_.isObject(globalConfig) || _.isEmpty(globalConfig)) { return }

    if (globalConfig.app) {
      global.app = this.app
    }
    if (globalConfig.promise) {
      global.Promise = Promise
    }
    if (globalConfig.log) {
      global.log = this.app.log
    }
    if (globalConfig.lodash) {
      global._ = _
    }
    return globalConfig
  }

  loadComponents () {

    const log = require('captains-log')(this.app.get('logger'))

    const components = {
      log,
    }

    return Promise.props(components)
      .then(components => {
        this.app = _.merge(this.app, components)
      })
  }

  connectDatabase () {
    const connectionConfig = this.app.get('connection')

    // sqlite

    const sqliteConfig = connectionConfig.sqlite
    if (sqliteConfig && !_.isEmpty(sqliteConfig)) {
      const file = sqliteConfig.file || ':memory:'
      const db = new sqlite.Database(file)
      this.app.log.info(`SQLite connected to ${file}`)
      this.app.sqlite = db
    }

    // redis
    // TODO

    // var mongoPath = 'mongodb://' + mongoConfig.host +
    //     ':' + mongoConfig.port +
    //     '/' + mongoConfig.database

    // // connect to mongo database
    // var tryMock = function () {
    //   if (mongoConfig.mock) {
    //     try {
    //       var mockgoose = require('mockgoose')
    //       return mockgoose(mongoose)
    //         .then(function () {
    //           app.log.verbose('Mock enabled, use memory as database.')
    //         })
    //     } catch (err) {
    //       app.log.warn('Set "mock: true" in configs/connection.js but "mockgoose" is not installed.')
    //     }
    //   }
    //   return Promise.resolve()
    // }

    // var connect = function () {
    //   return mongoose.connect(mongoPath)
    // }

    // return tryMock()
    //   .then(connect)
    //   .then(function () {
    //     app.log.info('Mongoose connected to', mongoPath)
    //   })
  }

  loadHttp () {
    const middlewareOrder = this.app.get('http').middlewares || [],
      middlewares = this.app.middlewares || {},
      installed = []

    for (const middlewareName of middlewareOrder) {
      if (_.has(middlewares, middlewareName)) {
        this.app.log.silly('App.loadHttp :: middleware', middlewareName, 'installed')
        const middleware = middlewares[middlewareName]
        this.app.use(middleware)
        installed.push(middlewareName)
      } else {
        this.app.log.warn('App.loadHttp :: middleware', middlewareName, 'not found')
      }
    }
    return Promise.resolve(installed)
  }

  startServer () {
    const server = http.createServer(this.app)

    const port = this.app.get('port') || 3000
    const hostname = this.app.get('hostname') || '127.0.0.1'

    server.listen(port, hostname)

    server.on('error', error => {
      if (error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port

      // handle specific listen errors with friendly messages
      switch (error.code) {
      case 'EACCES':
        this.app.log.error(bind + ' requires elevated privileges')
        process.exit(1)
        break
      case 'EADDRINUSE':
        this.app.log.error(bind + ' is already in use')
        process.exit(1)
        break
      default:
        throw error
      }
    })

    server.on('listening', () => {
      const addr = server.address()
      const bind = typeof addr === 'string'
        ? addr
        : addr.address + ':' + addr.port
      this.app.log.info('Listening on ' + bind)
    })
  }

  start (overrideConfig) {
    var app = this
    return app.loadConfigs(overrideConfig)
      .then(function () { return app.loadComponents() })
      .then(function () { return app.loadGlobals() })
      .then(function () { return app.loadModels() })
      .then(function () { return app.loadServices() })
      .then(function () { return app.loadControllers() })
      .then(function () { return app.loadMiddlewares() })
      .then(function () { return app.connectDatabase() })
      .then(function () { return app.loadHttp() })
      .then(function () { return app.startServer() })
  }
}

module.exports = App
