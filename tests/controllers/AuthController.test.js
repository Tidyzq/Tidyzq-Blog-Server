const assert = require('assert')
const _ = require('lodash')

describe('/api/auth', () => {

  describe('POST /api/auth/login', () => {

    it('登陆默认用户', () => {
      return agent.post('/api/auth/login')
        .send({
          email: 'admin@admin.com',
          password: 'administrator',
        })
        .expect(200)
        .expect(({ body }) => {
          assert(body.user)
          assert(body.accessToken)
          assert.equal(body.user.email, 'admin@admin.com')
          assert.ifError(body.user.password)
        })
    })

    it('不能够使用错误密码登陆', () => {
      return agent.post('/api/auth/login')
        .send({
          email: 'admin@admin.com',
          password: 'wrongpassword',
        })
        .expect(400)
    })

  })

  describe('GET /api/auth/check-login', () => {
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

    it('能够通过', () => {
      return agent.get('/api/auth/check-login')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
    })

    it('未登录不能通过', () => {
      return agent.get('/api/auth/check-login')
        .expect(401)
    })

  })

})
