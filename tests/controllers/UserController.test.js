const assert = require('assert')
const _ = require('lodash')

describe('UserController', () => {
  let user = {
    email: 'test_usercontroller_email',
    username: 'test_usercontroller_username',
    password: '123456',
    avatar: 'test_usercontroller_avatar',
  }
  let accessToken
  const wrongAccessToken = '1.2.3'

  const register = function () {
    return agent.post('/api/auth/register')
      .send(user)
      .expect(200)
      .expect(({ body }) => {
        assert.equal(body.email, user.email)
        assert.equal(body.username, user.username)
        assert.equal(body.avatar, user.avatar)
        assert.ifError(body.password)
        user.id = body.id
      })
  }

  const login = function () {
    return agent.post('/api/auth/login')
      .send({
        email: user.email,
        password: user.password,
      })
      .expect(200)
      .then(({ body }) => {
        assert(body.user)
        assert.equal(body.user.id, user.id)
        assert.equal(body.user.email, user.email)
        assert.equal(body.user.username, user.username)
        assert.equal(body.user.avatar, user.avatar)
        assert(body.accessToken)
        accessToken = body.accessToken
      })
  }

  before(register)

  before(login)

  describe('getUsers', () => {
    it('should able to get users list', () => {
      return agent.get('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(_.isArray(body))
          assert(headers['x-total-count'])
          assert.equal(body.length, parseInt(headers['x-total-count']))
        })
    })
    it('should not able to get users list without login', () => {
      return agent.get('/api/users')
        .expect(401)
    })
  })

  describe('getUser', () => {
    it('should able to get user info', () => {
      return agent.get(`/api/users/${user.id}`)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.id, user.id)
          assert.equal(body.email, user.email)
          assert.equal(body.username, user.username)
          assert.equal(body.avatar, user.avatar)
        })
    })
  })

  describe('update', () => {
    it('should able to update', () => {
      return agent.put(`/api/users/${user.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          username: 'testuser',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.id, user.id)
          assert.equal(body.email, user.email)
          assert.equal(body.avatar, user.avatar)
          assert.equal(body.username, 'testuser')
          user.username = 'testuser'
        })
    })
    it('should not able to change password', () => {
      // this.timeout(5000)
      const newPassword = '654321'
      return agent.put(`/api/users/${user.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          password: newPassword,
        })
        .expect(200)
        .then(({ body }) => {
          assert.equal(body.id, user.id)
          assert.equal(body.email, user.email)
          assert.equal(body.username, user.username)
          assert.equal(body.avatar, user.avatar)
        })
        .then(login)
    })

  })

})
