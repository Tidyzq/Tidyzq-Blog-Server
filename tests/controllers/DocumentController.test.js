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

  describe('POST /api/documents', () => {
    it('正常创建', () => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          title: 'document1',
          markdown: '# document1',
          type: 'draft',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.title, 'document1')
          assert.equal(body.markdown, '# document1')
          assert.equal(body.author, user.id)
        })
    })
    it('未登录无法创建', () => {
      return agent.post('/api/documents')
        .send({
          title: 'document2',
          markdown: '# document2',
          type: 'draft',
        })
        .expect(401)
    })
  })

  describe('GET /api/documents', () => {
    it('正常获取', () => {
      return agent.get('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(headers['x-total-count'], body.length)
        })
    })
    it('未登录无法获取', () => {
      return agent.get('/api/documents')
        .expect(401)
    })
  })

  describe('GET /api/documents/:documentId', () => {
    const testdocument = {
      title: 'testdocument_1',
      markdown: '# test document 1',
      type: 'draft',
    }

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testdocument)
        .expect(200)
        .expect(({ body }) => {
          assert(body)
          assert.equal(body.title, testdocument.title)
          assert.equal(body.markdown, testdocument.markdown)
          assert.equal(body.type, testdocument.type)
          _.assign(testdocument, body)
        })
    })

    it('正常获取', () => {
      return agent.get(`/api/documents/${testdocument.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testdocument, body)
        })
    })

    it('未登陆无法获取', () => {
      return agent.get(`/api/documents/${testdocument.id}`)
        .expect(401)
    })

    it('错误id无法获取', () => {
      return agent.get('/api/documents/wrongid')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(404)
    })
  })

  describe('PUT /api/document/:documentId', () => {
    const testdocument = {
      title: 'testdocument_2',
      markdown: '# test document 2',
      type: 'draft',
    }

    const testuser = {
      email: 'testdocumentcontroller_1',
      password: 'testdocumentcontroller_1',
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
        .then(() => {
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
    })

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testdocument)
        .expect(200)
        .expect(({ body }) => {
          assert(body)
          assert.equal(body.title, testdocument.title)
          assert.equal(body.markdown, testdocument.markdown)
          assert.equal(body.type, testdocument.type)
          _.assign(testdocument, body)
        })
    })

    it('正常修改', () => {
      return agent.put(`/api/documents/${testdocument.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          title: 'changed testdocument_2',
          markdown: '# changed test document 2',
          type: 'page',
        })
        .expect(200)
        .expect(({ body }) => {
          assert(body)
          assert.equal('changed testdocument_2', body.title)
          assert.equal('# changed test document 2', body.markdown)
          assert.equal('page', body.type)
          assert.notEqual(testdocument.modifiedAt, body.modifiedAt)
          assert.equal(testdocument.createdAt, body.createdAt)
          _.assign(testdocument, body)
        })
        .then(() => {
          return agent.get(`/api/documents/${testdocument.id}`)
            .set('Authorization', `JWT ${accessToken}`)
            .expect(200)
            .expect(({ body }) => {
              assert.deepEqual(testdocument, body)
            })
        })
    })

    it('未登陆无法修改', () => {
      return agent.put(`/api/documents/${testdocument.id}`)
        .send({
          title: 'changed testdocument_2',
        })
        .expect(401)
    })

    it('其他用户无法修改', () => {
      return agent.put(`/api/documents/${testdocument.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          title: 'changed testdocument_2',
          markdown: '# changed test document 2',
          type: 'page',
        })
        .expect(401)
    })
  })

  describe('DELETE /api/document/:documentId', () => {
    const testdocument = {
      title: 'testdocument_3',
      markdown: '# test document 3',
      type: 'draft',
    }

    const testuser = {
      email: 'testdocumentcontroller_2',
      password: 'testdocumentcontroller_2',
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
        .then(() => {
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
    })

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testdocument)
        .expect(200)
        .expect(({ body }) => {
          assert(body)
          assert.equal(body.title, testdocument.title)
          assert.equal(body.markdown, testdocument.markdown)
          assert.equal(body.type, testdocument.type)
          _.assign(testdocument, body)
        })
    })

    it('未登陆无法删除', () => {
      return agent.delete(`/api/documents/${testdocument.id}`)
        .expect(401)
    })

    it('其他用户无法删除', () => {
      return agent.delete(`/api/documents/${testdocument.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .expect(401)
    })

    it('正常删除', () => {
      return agent.delete(`/api/documents/${testdocument.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testdocument, body)
        })
        .then(() => {
          return agent.get(`/api/documents/${testdocument.id}`)
            .set('Authorization', `JWT ${accessToken}`)
            .expect(404)
        })
    })
  })

})
