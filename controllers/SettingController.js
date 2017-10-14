const Setting = require('../models/Setting')

module.exports = {

  /**
   * 获取全部设置
   */
  async getSettings (req, res) {
    try {
      let settings = await Setting.find()

      settings = _.reduce(settings, (result, { key, value }) => {
        result[key] = JSON.parse(value)
        return result
      }, {})

      res.ok(settings)
    } catch (err) {
      app.log.verbose(`SettingController :: getSettings ${err}`)
      res.badRequest(err.message)
    }
  },

  /**
   * 更新设置
   */
  async updateSettings (req, res) {
    try {
      let settings = req.body

      if (!_.isObject(settings)) {
        throw new Error('invalid body')
      }

      settings = _.map(settings, (value, key) =>
        new Setting({
          key,
          value: JSON.stringify(value),
        })
      )
      await Setting.save(settings)

      res.ok()
    } catch (err) {
      app.log.verbose(`SettingController :: updateSettings ${err}`)
      res.badRequest(err.message)
    }
  },

}
