process.chdir(__dirname)

const App = require('./app/index')

const app = new App()

app.start()
