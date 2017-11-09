const glob = require('glob')

const env = process.env.NODE_ENV || 'development'

function optionalRequire (filename) {
  try {
    return require(filename)
  } catch (e) {
    return undefined
  }
}

function requireAll ({ pattern, ignore }) {
  const files = glob.sync(pattern, { cwd: __dirname, ignore })
  return files.map(file => optionalRequire(`./${file}`))
    .reduce((result, config) => Object.assign(result, config), {})
}

const envConfig = optionalRequire(`./env/${env}`)

const overrideConfig = optionalRequire('../config.js')

const config = requireAll({
  pattern: '*.js',
  ignore: 'index.js',
})

module.exports = Object.assign(config, envConfig, overrideConfig)
