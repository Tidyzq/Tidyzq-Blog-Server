const winston = require('winston')
const config = require('../configs').logger

const log = new winston.Logger({
  level: config.level || 'info',
  transports: [ new winston.transports.Console({
    formatter (options) {
      return winston.config.colorize(options.level, options.level) + ' ' + (options.message ? options.message : '') +
        (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '')
    },
  }) ],
})

module.exports = log
