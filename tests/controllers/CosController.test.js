const assert = require('assert')
const _ = require('lodash')

describe('/api/cos', () => {
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

  describe('GET /api/cos/token', () => {
    it('正常获取', () => {
      return agent.get('/api/cos/token')
        .set('Authorization', `JWT ${accessToken}`)
        .send()
        .expect(200)
        .expect(({ body }) => {
          assert(body.token)
          assert.equal(typeof body.token, 'string')
        })
    })
    it('未登录无法创建', () => {
      return agent.get('/api/cos/token')
        .send()
        .expect(401)
    })
  })
})
