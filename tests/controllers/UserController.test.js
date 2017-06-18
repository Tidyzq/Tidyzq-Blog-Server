const assert = require('assert')
const _ = require('lodash')

describe('/api/users', () => {
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

  describe('GET /api/users', () => {
    it('能够获取用户列表', () => {
      return agent.get('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(_.isArray(body))
          assert(headers['x-total-count'])
          assert.equal(body.length, parseInt(headers['x-total-count']))
        })
    })
    it('未登录无法获取用户列表', () => {
      return agent.get('/api/users')
        .expect(401)
    })
  })

  describe('POST /api/users', () => {
    it('能够创建用户', () => {
      return agent.post('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          username: 'testusercontroller_1',
          email: 'testusercontroller_1',
          password: 'testusercontroller_1',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.username, 'testusercontroller_1')
          assert.equal(body.email, 'testusercontroller_1')
          assert.ifError(body.password)
        })
    })
    it('未登陆无法创建用户', () => {
      return agent.post('/api/users')
        .send({
          username: 'testusercontroller_2',
          email: 'testusercontroller_2',
          password: 'testusercontroller_2',
        })
        .expect(401)
    })
    it('未提供密码无法创建用户', () => {
      return agent.post('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          username: 'testusercontroller_3',
          email: 'testusercontroller_3',
        })
        .expect(400)
    })
  })

  describe('GET /api/users/:userId', () => {
    it('能够获取用户信息', () => {
      return agent.get(`/api/users/${user.id}`)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.id, user.id)
          assert.equal(body.email, user.email)
          assert.equal(body.username, user.username)
          assert.equal(body.avatar, user.avatar)
        })
    })
    it('非法Id无法获取', () => {
      return agent.get('/api/users/test')
        .expect(404)
    })
  })

  describe('PUT /api/users/:userId', () => {

    const testuser = {
      email: 'testusercontroller_4',
      password: 'testusercontroller_4',
    }
    let testAccessToken

    before(() => {
      return agent.post('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testuser)
        .expect(200)
        .expect(({ body }) => {
          _.assign(testuser, body)
        })
    })

    before(() => {
      return agent.post('/api/auth/login')
        .send({
          email: testuser.email,
          password: testuser.password,
        })
        .expect(200)
        .expect(({ body }) => {
          testAccessToken = body.accessToken
        })
    })

    it('能够更新用户信息', () => {
      return agent.put(`/api/users/${testuser.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          username: 'testuser',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.id, testuser.id)
          assert.equal(body.email, testuser.email)
          assert.equal(body.avatar, testuser.avatar)
          assert.equal(body.username, 'testuser')
          assert.ifError(body.password)
          testuser.username = 'testuser'
        })
    })
    it('未登陆无法更新', () => {
      return agent.put(`/api/users/${testuser.id}`)
        .send({
          username: 'testuser',
        })
        .expect(401)
    })
    it('只能更新自己', () => {
      return agent.put(`/api/users/${testuser.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          username: 'testuser',
        })
        .expect(401)
    })
    it('不能更新密码', () => {
      return agent.put(`/api/users/${testuser.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          password: '654321',
        })
        .expect(200)
        .then(() => {
          return agent.post('/api/auth/login')
            .send({
              email: testuser.email,
              password: testuser.password,
            })
            .expect(200)
        })
    })

  })

  describe('DELETE /api/users/:userId', () => {
    const testuser = {
      email: 'testusercontroller_5',
      password: 'testusercontroller_5',
    }
    let testAccessToken

    before(() => {
      return agent.post('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testuser)
        .expect(200)
        .expect(({ body }) => {
          _.assign(testuser, body)
        })
    })

    before(() => {
      return agent.post('/api/auth/login')
        .send({
          email: testuser.email,
          password: testuser.password,
        })
        .expect(200)
        .expect(({ body }) => {
          testAccessToken = body.accessToken
        })
    })

    it('未登陆无法删除', () => {
      return agent.delete(`/api/users/${testuser.id}`)
        .expect(401)
    })

    it('非本人无法删除', () => {
      return agent.delete(`/api/users/${testuser.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(401)
    })

    it('成功删除', () => {
      return agent.delete(`/api/users/${testuser.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .expect(200)
        .then(() => {
          return agent.get(`/api/users/${testuser.id}`)
            .expect(404)
        })
    })
  })

  describe('PUT /api/users/:userId/password', () => {
    const testuser = {
      email: 'testusercontroller_6',
      password: 'testusercontroller_6',
    }
    let testAccessToken

    before(() => {
      return agent.post('/api/users')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testuser)
        .expect(200)
        .expect(({ body }) => {
          _.assign(testuser, body)
        })
    })

    before(() => {
      return agent.post('/api/auth/login')
        .send({
          email: testuser.email,
          password: testuser.password,
        })
        .expect(200)
        .expect(({ body }) => {
          testAccessToken = body.accessToken
        })
    })

    it('能够修改密码', () => {
      return agent.put(`/api/users/${testuser.id}/password`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          oldPassword: testuser.password,
          newPassword: 'newPassword',
        })
        .expect(200)
        .expect(() => {
          testuser.password = 'newPassword'
        })
        .then(() => {
          return agent.post('/api/auth/login')
            .send({
              email: testuser.email,
              password: testuser.password,
            })
            .expect(200)
        })
    })

    it('未登录不能修改密码', () => {
      return agent.put(`/api/users/${testuser.id}/password`)
        .send({
          oldPassword: testuser.password,
          newPassword: 'newPassword1',
        })
        .expect(401)
        .then(() => {
          return agent.post('/api/auth/login')
            .send({
              email: testuser.email,
              password: testuser.password,
            })
            .expect(200)
        })
    })

    it('错误旧密码不能修改密码', () => {
      return agent.put(`/api/users/${testuser.id}/password`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newPassword2',
        })
        .expect(400)
        .then(() => {
          return agent.post('/api/auth/login')
            .send({
              email: testuser.email,
              password: testuser.password,
            })
            .expect(200)
        })
    })
  })

})
