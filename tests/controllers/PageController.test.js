const assert = require('assert')
const _ = require('lodash')

describe('/api/pages', () => {
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

  describe('GET /api/pages/:pageUrl', () => {
    const testPage = {
      title: 'testpage_1',
      markdown: '# test page 1',
      type: 'page',
    }

    before(() => {
      return agent.post('/api/documents')
        .set('Authorization', `JWT ${accessToken}`)
        .send(testPage)
        .expect(200)
        .expect(({ body }) => {
          assert.equal(testPage.title, body.title)
          assert.equal(testPage.markdown, body.markdown)
          assert.equal(testPage.type, body.type)
          _.assign(testPage, body)
        })
    })

    it('能够正常获取', () => {
      return agent.get(`/api/pages/${testPage.url}`)
        .expect(200)
        .expect(({ body }) => {
          assert.deepEqual(testPage, body)
        })
    })
  })

})
