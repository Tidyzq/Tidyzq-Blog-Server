const express = require('express')
const path = require('path')
const http = require('http')

const Promise = require('bluebird')
const _ = require('lodash')
const includeAll = require('include-all')
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
    const customConfigs = new Promise((resolve, reject) => {
      includeAll.aggregate({
        dirname: path.join(CWD, 'configs'),
        excludeDirs: /^env$/,
        filter: /(.+)\.js$/,
      }, (err, modules) => {
        err ? reject(err) : resolve(modules)
      })
    })

    // load env configs
    const envConfigs = includeAll({
      dirname: path.join(CWD, 'configs', 'env'),
      filter: /(.+)\.js$/,
    })

    overrideConfigs = overrideConfigs || {}

    return Promise
      .props({
        customConfigs,
        envConfigs,
        overrideConfigs,
      })
      .then(configs => {
        const env = process.env.NODE_ENV || 'development'
        // select env config
        configs.env = configs.envConfigs[env]
        // merge configs
        configs = _.merge(configs.customConfigs, configs.env, configs.overrideConfigs)
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
      filter: /^(?!\.)(.+)\.js$/,
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
    if (globalConfig.Promise) {
      global.Promise = Promise
    }
    if (globalConfig.log) {
      global.log = this.app.log
    }
    if (globalConfig._) {
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

  initDatabase () {
    const models = this.app.models || {}

    return Promise.all(_.map(models, (model, modelName) => {
      if (_.isFunction(model.init)) {
        return model.init()
      } else {
        this.app.log.warn(`App.initDatabse :: model ${modelName}.init method not found`)
      }
    }))
  }

  mountMiddlewares () {
    const middlewareOrder = this.app.get('http').middlewares || [],
      middlewares = this.app.middlewares || {},
      installed = []

    for (const middlewareName of middlewareOrder) {
      if (_.has(middlewares, middlewareName)) {
        this.app.log.silly(`App.mountMiddlewares :: middleware ${middlewareName} installed`)
        const middleware = middlewares[middlewareName]
        this.app.use(middleware)
        installed.push(middlewareName)
      } else {
        this.app.log.warn(`App.mountMiddlewares :: middleware' ${middlewareName} not found`)
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
    return this.loadConfigs(overrideConfig)
      .then(() => this.loadComponents() )
      .then(() => this.loadGlobals() )
      .then(() => this.loadModels() )
      .then(() => this.loadServices() )
      .then(() => this.loadControllers() )
      .then(() => this.loadMiddlewares() )
      .then(() => this.connectDatabase() )
      .then(() => this.initDatabase() )
      .then(() => this.mountMiddlewares() )
      .then(() => this.startServer() )
  }
}

module.exports = App
