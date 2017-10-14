const express = require('express')
const path = require('path')
const http = require('http')
// const EventEmitter = require('events')

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

    return Promise.all([ customConfigs, envConfigs, overrideConfigs ])
      .then(([ customConfigs, envConfigs, overrideConfigs ]) => ({ customConfigs, envConfigs, overrideConfigs }))
      .then(configs => {
        const env = process.env.NODE_ENV || 'development'
        // select env config
        configs.env = configs.envConfigs[env]
        // merge configs
        configs = _.merge(configs.customConfigs, configs.env, configs.overrideConfigs)
        // apply config settings
        for (const moduleName in configs) {
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

  // loadControllers () {
  //   const controllers = this.loadConfigFromDirectory('controllers')
  //   this.app.controllers = controllers
  //   return controllers
  // }

  // loadModels () {
  //   const models = this.loadConfigFromDirectory('models')
  //   this.app.models = models
  //   return models
  // }

  // loadServices () {
  //   const services = this.loadConfigFromDirectory('services')
  //   this.app.services = services
  //   return services
  // }

  // loadMiddlewares () {
  //   const middlewares = this.loadConfigFromDirectory('middlewares')
  //   this.app.middlewares = middlewares
  //   return middlewares
  // }

  loadGlobals () {
    global.app = this.app
    global.log = this.app.log
    global._ = _
  }

  loadComponents () {

    this.app.log = require('captains-log')(this.app.get('logger'))
    // this.app.event = new EventEmitter()
    this.app.initDatabase = []

    return Promise.resolve()
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
  }

  initDatabase () {
    const initHandlers = this.app.initDatabase || []

    return Promise.all(_.map(initHandlers, initHandler => {
      if (_.isFunction(initHandler)) {
        return initHandler()
      } else {
        this.app.log.warn(`App.initDatabase :: invalid init ${initHandler}`)
      }
    }))
  }

  mountMiddlewares () {
    const middlewares = this.app.get('http').middlewares || [],
      installed = []

    for (const middleware of middlewares) {
      this.app.log.silly(`App.mountMiddlewares :: middleware ${middleware.name} installed`)
      this.app.use(middleware)
      installed.push(middleware)
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
    return Promise.resolve()
      .then(() => this.loadConfigs(overrideConfig))
      .then(() => this.loadComponents() )
      .then(() => this.loadGlobals() )
      // .then(() => this.loadModels() )
      // .then(() => this.loadServices() )
      // .then(() => this.loadControllers() )
      // .then(() => this.loadMiddlewares() )
      .then(() => this.connectDatabase() )
      .then(() => this.mountMiddlewares() )
      .then(() => this.initDatabase() )
      .then(() => this.startServer() )
      .catch(e => {
        console.log(e.message, e.stack)
        process.exit()
      })
  }
}

module.exports = App
