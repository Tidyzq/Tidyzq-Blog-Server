process.env.NODE_ENV = 'testing'

const App = require('../app/index')
const supertest = require('supertest')

const server = new App()

before(function () {
  this.timeout(5000)
  // start app for tests
  return server.start()
    .then(() => {
      const app = server.app
      global.agent = supertest(app)
    })
})

after(function () {
  server.close()
})
