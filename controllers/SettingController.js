const Setting = app.models.Setting

module.exports = {

  /**
   * 获取全部设置
   */
  getSettings (req, res) {
    Setting.find()
      .then(settings => {
        return _.reduce(settings, (result, setting) => {
          result[setting.key] = JSON.parse(setting.value)
        }, {})
      })
      .then(settings => {
        res.ok(settings)
      })
      .catch(err => {
        app.log.verbose(`SettingController :: getSettings ${err}`)
        res.badRequest(err.message)
      })
  },

  /**
   * 更新设置
   */
  updateSettings (req, res) {
    const settings = req.body

    Promise.resolve(settings)
      .then(settings => {
        if (!_.isObject(settings)) {
          throw new Error('invalid body')
        }
        return settings
      })
      .then(settings => {
        return _.map(settings, (value, key) => {
          return new Setting({
            key,
            value: JSON.stringify(value),
          })
        })
      })
      .then(settings => {
        return Setting.save(settings)
      })
      .then(() => {
        res.ok()
      })
      .catch(err => {
        app.log.verbose(`SettingController :: updateSettings ${err}`)
        res.badRequest(err.message)
      })
  },

}
