var assert = require('assert')

describe('/api/auth', () => {
  describe('/api/auth/login', () => {
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
})
