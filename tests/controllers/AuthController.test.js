var assert = require('assert')

describe('AuthController', () => {
  describe('register', () => {
    it('should able to register', () => {
      return agent.post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'testemail',
          password: '123456',
          avatar: 'testavatar',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.username, 'testuser')
          assert.equal(body.email, 'testemail')
          assert.equal(body.avatar, 'testavatar')
          assert.ifError(body.password)
        })
    })
    it('should not register again', () => {
      return agent.post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'testemail',
          password: '123456',
          avatar: 'testavatar',
        })
        .expect(400)
    })
    it('must provide password', () => {
      return agent.post('/api/auth/register')
        .send({
          username: 'testuser1',
          email: 'testemail1',
          avatar: 'testavatar1',
        })
        .expect(400)
    })
    it('must provide email', () => {
      return agent.post('/api/auth/register')
        .send({
          username: 'testuser1',
          password: '123456',
          avatar: 'testavatar1',
        })
        .expect(400)
    })
  })
  describe('login', () => {
    it('should able to login', () => {
      return agent.post('/api/auth/login')
        .send({
          email: 'testemail',
          password: '123456',
        })
        .expect(200)
        .expect(({ body }) => {
          assert(body.user)
          assert.equal(body.user.email, 'testemail')
          assert(body.accessToken)
        })
    })
    it('should not able to login with wrong password', () => {
      return agent.post('/api/auth/login')
        .send({
          email: 'testemail',
          password: '123',
        })
        .expect(400)
    })
    it('should not able to login without password', () => {
      return agent.post('/api/auth/login')
        .send({
          username: 'testuser',
        })
        .expect(400)
    })
  })
})
