const _ = require('lodash')
const unidecode = require('unidecode')

function secureUrl (string) {
  // Handle the £ symbol separately, since it needs to be removed before the unicode conversion.
  string = string.replace(/£/g, '-')

  // Remove non ascii characters
  string = unidecode(string)

  // Replace URL reserved chars: `@:/?#[]!$&()*+,;=` as well as `\%<>|^~£"{}'` and \`
  string = _.compact(string.split(/\s|\.|@|:|\/|\?|#|\[|\]|!|\$|&|\(|\)|\*|\+|,|;|=|\\|%|<|>|\||\^|~|"|\{|\}|`|'|–|—/g))
    .join('-')
    // Make the whole thing lowercase
    .toLowerCase()

  // Handle whitespace at the beginning or end.
  string = string.trim()

  return string
}

function generateUrl (model, title) {
  const url = secureUrl(title)
  let postfix = 0

  const resultUrl = () => { return postfix ? `${url}-${postfix}` : url }

  const find = () => {
    return model.findOne({ url: resultUrl() })
      .then(found => {
        if (found) { throw new Error('Confilct Url') }
      })
  }

  const generate = () => {
    return find()
      .then(() => resultUrl())
      .catch(() => {
        postfix += 1
        return generate()
      })
  }

  return generate()
}

exports.secureUrl = secureUrl

exports.generateUrl = generateUrl
