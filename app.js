process.chdir(__dirname)

const App = require('./app/index')

const app = new App()

let overrideConfig = {}

try {
  overrideConfig = require('./config.js')
} catch (err) {
  // ignore
}

app.start(overrideConfig)
