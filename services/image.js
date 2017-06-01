var path = require('path')

module.exports = {

  saveImage (field, savePath) {
    return function (req) {
      return new Promise(function (resolve, reject) {
        req.file(field)
          .upload(
            { dirname: savePath },
            function (err, files) {
              if (err) { return reject(err) }
              if (files.length == 0) { reject(Error('No Image Provided')) }
              resolve(files[0])
            })
      })
    }
  },

  generateUrl (staticPath) {
    return function (file) {
      var url = 'http://' + app.get('hostname') + ':' + app.get('port') + '/' +
                path.relative(staticPath, file.fd)
      return url
    }
  },

}
