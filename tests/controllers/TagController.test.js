const assert = require('assert')
const _ = require('lodash')

describe('/api/documents', () => {
  const user = {
    email: 'admin@admin.com',
    password: 'administrator',
  }
  let accessToken
  // const wrongAccessToken = '1.2.3'

  before(() => {
    return agent.post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200)
      .then(({ body }) => {
        assert(body.user)
        assert.equal(body.user.email, user.email)
        assert(body.accessToken)
        accessToken = body.accessToken
        _.assign(user, body.user)
      })
  })

})
