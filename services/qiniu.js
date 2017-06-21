const qiniu = require('qiniu')
const url = require('url')
const formstream = require('formstream')
const qiniuConfig = app.get('qiniu')

qiniu.conf.ACCESS_KEY = qiniuConfig.accessKey
qiniu.conf.SECRET_KEY = qiniuConfig.secretKey
const bucket = qiniuConfig.bucket
const host = qiniuConfig.host

function uptoken (key) {
  console.log(key)
  const putPolicy = new qiniu.rs.PutPolicy(`${bucket}:${key}`)
  return putPolicy.token()
}

function getMultipart (uptoken, key, buffer, extra) {

  const form = formstream()

  form.field('token', uptoken)
  form.field('key', key)
  form.buffer('file', buffer, key, extra.mimeType)

  return form
}

exports.upload = function (key, buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const token = uptoken(key)

    const extra = new qiniu.io.PutExtra()
    extra.mimeType = mimeType

    const form = getMultipart(token, key, buffer, extra)

    qiniu.zone.up_host(token, qiniu.conf)

    qiniu.rpc.postMultipart(qiniu.conf.UP_HOST, form, (err, rst) => {
      if (err) {
        return reject(err)
      }
      rst.url = url.resolve(host, rst.key)
      resolve(rst)
    })
  })
}
