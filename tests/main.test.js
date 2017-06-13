const App = require('../app/index')
const supertest = require('supertest')

process.env.NODE_ENV = 'testing'

before(function () {
  this.timeout(5000)
  // start app for tests
  const server = new App()
  return server.start()
    .then(() => {
      const app = server.app
      global.agent = supertest(app)
    })
})
