const COS = require('cos-nodejs-sdk-v5')
const cosConfig = require('../configs').cos
const qcloudConfig = cosConfig.qcloud

const cos = new COS({
  AppId: qcloudConfig.appId,
  SecretId: qcloudConfig.secretId,
  SecretKey: qcloudConfig.secretKey,
})

exports.getAuth = function (method, key) {
  return cos.getAuth({ Method: method, Key: key })
}
