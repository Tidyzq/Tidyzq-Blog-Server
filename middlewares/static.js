const express = require('express')
const staticConfig = require('../configs').static

module.exports = express.static(staticConfig)
