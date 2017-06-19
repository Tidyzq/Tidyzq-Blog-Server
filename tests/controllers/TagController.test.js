const assert = require('assert')
const _ = require('lodash')

describe('/api/tags', () => {
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

  describe('POST /api/tags', () => {

    it('正常创建', () => {
      return agent.post('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          name: 'tag_1',
        })
        .expect(200)
        .expect(({ body }) => {
          assert(body)
          assert.equal(body.name, 'tag_1')
        })
    })

    it('未登陆无法创建', () => {
      return agent.post('/api/tags')
        .send({
          name: 'tag_2',
        })
        .expect(401)
    })

  })

  describe('GET /api/tags', () => {

    it('正常获取', () => {
      return agent.get('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(body)
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(body.length, headers['x-total-count'])
        })
    })

    it('未登录无法获取', () => {
      return agent.get('/api/tags')
        .expect(401)
    })

  })

  describe('GET /api/tags/id/:tagId', () => {
    const testTag = {
      name: 'testtag_1',
    }

    before(() => {
      return agent.post('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testTag)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.name, testTag.name)
          _.assign(testTag, body)
        })
    })

    it('正常获取', () => {
      return agent.get(`/api/tags/id/${testTag.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testTag, body)
        })
    })

    it('未登陆无法获取', () => {
      return agent.get(`/api/tags/id/${testTag.id}`)
        .expect(401)
    })

    it('错误id无法获取', () => {
      return agent.get('/api/tags/id/wrongid')
        .set('Authorization', `JWT ${accessToken}`)
        .expect(404)
    })

  })

  describe('PUT /api/tags/id/:tagId', () => {
    const testTag = {
      name: 'testtag_2',
    }

    const testuser = {
      email: 'testtagcontroller_1',
      password: 'testtagcontroller_1',
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
      return agent.post('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testTag)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.name, testTag.name)
          _.assign(testTag, body)
        })
    })

    it('正常修改', () => {
      return agent.put(`/api/tags/id/${testTag.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .send({
          name: 'changed_testtag_2_1',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testTag.id, body.id)
          assert.equal('changed_testtag_2_1', body.name)
          assert.equal(testTag.url, body.url)
          _.assign(testTag, body)
        })
    })

    it('未登陆无法修改', () => {
      return agent.put(`/api/tags/id/${testTag.id}`)
        .send({
          name: 'changed_testtag_2_2',
        })
        .expect(401)
    })

    it('任何人登陆可以修改', () => {
      return agent.put(`/api/tags/id/${testTag.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .send({
          name: 'changed_testtag_2_3',
        })
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testTag.id, body.id)
          assert.equal('changed_testtag_2_3', body.name)
          assert.equal(testTag.url, body.url)
          _.assign(testTag, body)
        })
    })
  })

  describe('DELETE /api/tags/id/:tagId', () => {
    const testTag = {
      name: 'testtag_3',
    }

    const testuser = {
      email: 'testtagcontroller_2',
      password: 'testtagcontroller_2',
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
      return agent.post('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testTag)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.name, testTag.name)
          _.assign(testTag, body)
        })
    })

    it('未登录无法删除', () => {
      return agent.delete(`/api/tags/id/${testTag.id}`)
        .expect(401)
    })

    it('其他用户可以删除', () => {
      return agent.delete(`/api/tags/id/${testTag.id}`)
        .set('Authorization', `JWT ${testAccessToken}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testTag, body)
        })
    })
  })

  describe('POST /api/documents/:documentId/tags', () => {
    const testTag = {
      name: 'testtag_4',
    }
    const testDocument = {
      title: 'testtagdocument_4',
      markdown: '# test tag document 4',
      type: 'draft',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    it('未登陆无法链接', () => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .send([ testTag.id ])
        .expect(401)
    })

    it('正常链接', () => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
        .expect(({ body }) => {
          assert(_.isArray(body))
          assert.equal(body.length, 1)
          assert.equal(body[0].documentId, testDocument.id)
          assert.equal(body[0].tagId, testTag.id)
        })
    })
  })

  describe('GET /api/documents/:documentId/tags', () => {
    const testTag = {
      name: 'testtag_5',
    }
    const testDocument = {
      title: 'testtagdocument_5',
      markdown: '# test tag document 5',
      type: 'draft',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    before(() => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('能够获取', () => {
      return agent.get(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(headers['x-total-count'], body.length)
          assert.equal(body.length, 1)
          assert.deepEqual(body[0], testTag)
        })
    })

    it('未登录无法获取', () => {
      return agent.get(`/api/documents/${testDocument.id}/tags`)
        .expect(401)
    })
  })

  describe('DELETE /api/documents/:documentId/tags/:tagId', () => {
    const testTag = {
      name: 'testtag_6',
    }
    const testDocument = {
      title: 'testtagdocument_6',
      markdown: '# test tag document 6',
      type: 'draft',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    before(() => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('未登陆无法删除', () => {
      return agent.delete(`/api/documents/${testDocument.id}/tags/${testTag.id}`)
        .expect(401)
    })

    it('正常删除', () => {
      return agent.delete(`/api/documents/${testDocument.id}/tags/${testTag.id}`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.documentId, testDocument.id)
          assert.equal(body.tagId, testTag.id)
        })
    })

  })

  describe('GET /api/tags/id/:tagId/documents', () => {
    const testTag = {
      name: 'testtag_7',
    }
    const testDocument = {
      title: 'testtagdocument_7',
      markdown: '# test tag document 7',
      type: 'draft',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    before(() => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('正常获取', () => {
      return agent.get(`/api/tags/id/${testTag.id}/documents`)
        .set('Authorization', `JWT ${accessToken}`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(headers['x-total-count'], body.length)
          assert.equal(body.length, 1)
          assert.deepEqual(body[0], testDocument)
        })
    })

    it('未登录无法获取', () => {
      return agent.get(`/api/tags/id/${testTag.id}/documents`)
        .expect(401)
    })
  })

  describe('GET /api/tags/url/:tagUrl', () => {
    const testTag = {
      name: 'testtag_8',
    }

    before(() => {
      return agent.post('/api/tags')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testTag)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(body.name, testTag.name)
          _.assign(testTag, body)
        })
    })

    it('正常获取', () => {
      return agent.get(`/api/tags/url/${testTag.url}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(body, testTag)
        })
    })
  })

  describe('GET /api/tags/url/:tagUrl/posts', () => {
    const testTag = {
      name: 'testtag_9',
    }
    const testDocument = {
      title: 'testtagdocument_9',
      markdown: '# test tag document 9',
      type: 'post',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    before(() => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('正常获取', () => {
      return agent.get(`/api/tags/url/${testTag.url}/posts`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(headers['x-total-count'], body.length)
          assert.equal(body.length, 1)
          assert.deepEqual(body[0], testDocument)
        })
    })
  })

  describe('GET /api/posts/:postUrl/tags', () => {
    const testTag = {
      name: 'testtag_10',
    }
    const testDocument = {
      title: 'testtagdocument_10',
      markdown: '# test tag document 10',
      type: 'post',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testDocument)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testDocument, body)
          }),
        agent.post('/api/tags')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testTag)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testTag, body)
          }),
      ])
    })

    before(() => {
      return agent.post(`/api/documents/${testDocument.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('正常获取', () => {
      return agent.get(`/api/posts/${testDocument.url}/tags`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(headers['x-total-count'], body.length)
          assert.equal(body.length, 1)
          assert.deepEqual(body[0], testTag)
        })
    })
  })

})
