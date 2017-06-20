const assert = require('assert')
const _ = require('lodash')

describe('/api/posts', () => {
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

  describe('GET /api/posts', () => {
    const testPost = {
      title: 'testpost_1',
      markdown: '# test post 1',
      type: 'post',
    }

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testPost)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testPost.title, body.title)
          assert.equal(testPost.markdown, body.markdown)
          assert.equal(testPost.type, body.type)
          _.assign(testPost, body)
        })
    })

    it('能够正常获取', () => {
      return agent.get('/api/posts')
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(body.length, headers['x-total-count'])
          assert(_.some(body, _.isEqual.bind(_, testPost)))
        })
    })
  })

  describe('GET /api/posts/:postUrl', () => {
    const testPost = {
      title: 'testpost_2',
      markdown: '# test post 2',
      type: 'post',
    }

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testPost)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testPost.title, body.title)
          assert.equal(testPost.markdown, body.markdown)
          assert.equal(testPost.type, body.type)
          _.assign(testPost, body)
        })
    })

    it('能够正常获取', () => {
      return agent.get(`/api/posts/${testPost.url}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testPost, body)
        })
    })
  })

  describe('GET /api/posts/:postUrl/tags', () => {
    const testTag = {
      name: 'testposttag_3',
    }
    const testPost = {
      title: 'testpost_3',
      markdown: '# test post 3',
      type: 'post',
    }

    before(() => {
      return Promise.all([
        agent.post('/api/documents')
          .set('Authorization', `JWT ${accessToken}`)
          .send(testPost)
          .expect(200)
          .expect(({ body }) => {
            _.assign(testPost, body)
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
      return agent.post(`/api/documents/${testPost.id}/tags`)
        .set('Authorization', `JWT ${accessToken}`)
        .send([ testTag.id ])
        .expect(200)
    })

    it('能够正常获取', () => {
      return agent.get(`/api/posts/${testPost.url}/tags`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert.equal(body.length, headers['x-total-count'])
          assert.equal(body.length, 1)
          assert.deepEqual(body[0], testTag)
        })
    })

  })

  describe('GET /api/users/:userId/posts', () => {
    const testPost = {
      title: 'testpost_4',
      markdown: '# test post 4',
      type: 'post',
    }

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testPost)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testPost.title, body.title)
          assert.equal(testPost.markdown, body.markdown)
          assert.equal(testPost.type, body.type)
          _.assign(testPost, body)
        })
    })

    it('能够正确获取', () => {
      return agent.get(`/api/users/${user.id}/posts`)
        .expect(200)
        .expect(({ headers, body }) => {
          assert(headers['x-total-count'])
          assert(_.isArray(body))
          assert(body.length, headers['x-total-count'])
          assert(_.some(body, _.isEqual.bind(_, testPost)))
        })
    })
  })

})
