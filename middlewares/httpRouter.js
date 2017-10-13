const express = require('express')
const _config = app.get('http').routes
const controllers = app.controllers
const Router = express.Router

/**
 * 递归函数，根据 http 中的路由设置递归构建 Router 对象
 * @param prefix 路由前缀
 * @param path 当前路由路径
 * @param config 路由设置
 */
const buildRouter = function (prefix, path, config) {
  const router = Router({ mergeParams: true }) // mergeParams 允许路由参数传递

  for (const key in config) {
    let val = config[key]

    if (_.isString(val)) {
      val = [ val ]
    }

    if (_.isArray(val)) {

      const method = key

      app.log.silly(`Http Router Middleware :: Bind [${method}] ${prefix + path}`)

      const handlers = _.filter(
        _.map(val, handlerPath => {
          const handler = _.get(controllers, handlerPath)
          if (!handler) { log.error(`Http Router Middleware :: ${handlerPath} not found`) }
          // transform async function
          if (Object.prototype.toString.call(handler) === '[object AsyncFunction]') {
            return (...args) => handler.apply(null, args).catch(args[2]) // args[2] for next
          }
          return handler
        }),
        _.isFunction)

      router[method].apply(router, _.concat(path, handlers))

    } else if (_.isObject(val)) {

      const nextPath = key

      const subRouter = buildRouter(prefix + path, nextPath, val)

      router.use(path, subRouter)

    } else {
      log.error(`Http Router Middleware :: Invalid config ${val}`)
    }
  }

  return router
}

module.exports = buildRouter('', '', _config)
