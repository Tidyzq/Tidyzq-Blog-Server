const express = require('express')
const http = require('http')
// const _ = require('lodash')
const config = require('../configs')
const log = require('../services/log')
const initQueue = require('../services/initQueue')


class App {

  constructor () {
    this.app = express()
    this.server = null
    this.app.set('path', process.cwd())
  }

  initDatabase () {
    return initQueue.apply()
  }

  mountMiddlewares () {
    const middlewares = config.http.middlewares || [],
      installed = []

    for (const middleware of middlewares) {
      log.silly(`App.mountMiddlewares :: middleware ${middleware.name} installed`)
      this.app.use(middleware)
      installed.push(middleware)
    }
    return installed
  }

  startServer () {
    const server = http.createServer(this.app)
    this.server = server

    const port = config.port || 3000
    const hostname = config.hostname || '127.0.0.1'

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
        log.error(bind + ' requires elevated privileges')
        process.exit(1)
        break
      case 'EADDRINUSE':
        log.error(bind + ' is already in use')
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
      log.info('Listening on ' + bind)
    })
  }

  async start () {
    try {
      await this.mountMiddlewares()
      await this.initDatabase()
      await this.startServer()
    } catch (e) {
      log.error(e.message, e.stack)
      process.exit()
    }
  }

  close () {
    this.server && this.server.close()
  }
}

module.exports = App
