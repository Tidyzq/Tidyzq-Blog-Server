const { Router } = require('express')
const _ = require('lodash')
const log = require('../services/log')
const { http: { routes: routesConfig }} = require('../configs')

function buildRouter (config) {
  const router = Router()
  buildRouterInner(router, '', config)
  return router
}

/**
 * 递归函数，根据 http 中的路由设置递归构建 Router 对象
 * @param {Express.router} router
 * @param {String} path 当前路由路径
 * @param {Object} config 路由设置
 */
function buildRouterInner (router, path, config) {

  _.forEach(config, (val, key) => {
    if (typeof val === 'function') { // 传入单个函数，转换为数组处理
      val = [ val ]
    }
    if (Array.isArray(val)) { // 传入函数数组，转换为单个处理函数
      const method = key.toUpperCase()
      log.silly(`Http Router Middleware :: Bind [${method}] ${path}`)

      const handlers = val.map((func, i) => {
        if (typeof func !== 'function') {
          log.error(`Http Router Middleware :: handler is not function at ${i}`)
          func = (req, res, next) => next()
        }
        return function (req, res) {
          let returnVal = Promise.resolve()
          const funcReturn = func(req, res, function (breakNext) {
            returnVal = !breakNext && i < val.length - 1 ? handlers[i + 1](req, res) : Promise.resolve(true)
            return returnVal
          })
          if (funcReturn && funcReturn.then) {
            return funcReturn.then(() => returnVal)
          } else {
            return returnVal
          }
        }
      })

      const realHandler = function (req, res, next) {
        handlers[0](req, res)
          .then(goNext => {
            goNext && next()
          })
          .catch(next)
      }
      if (method === 'ALL') {
        router.all([ path, path + '/*' ], realHandler)
      } else {
        router[key.toLowerCase()](path, realHandler)
      }
    } else if (typeof val === 'object') { // 如果是对象，则递归
      const nextPath = key

      buildRouterInner(router, path + nextPath, val)

    } else {
      log.error(`Http Router Middleware :: Invalid config ${key}:${val}`)
    }
  })

  return router
}

module.exports = buildRouter(routesConfig)
