const multer = require('multer')
const qiniuService = app.services.qiniu

module.exports = {

  /**
   * 提取文件
   */
  extractFiles: multer().array('images'),

  /**
   * 上传图片
   */
  upload (req, res) {
    log.silly(req.files)
    Promise.all(_.map(req.files, file => {
      return qiniuService.upload(file.originalname, file.buffer, file.mimeType)
    }))
      .then(rsts => {
        res.ok(rsts)
      })
      .catch(err => {
        log.verbose(`ImageController.upload :: ${err.stack}`)
        res.badRequest(err)
      })
  },

}
