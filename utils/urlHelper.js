// const log = require('../services/log')
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

async function generateUrl (model, title) {
  const url = secureUrl(title)
  let postfix = -1, found = false, resultUrl = ''

  do {
    postfix += 1
    resultUrl = postfix ? `${url}-${postfix}` : url
    found = await model.findOne({ url: resultUrl })
  } while (found)

  return resultUrl
}

exports.secureUrl = secureUrl

exports.generateUrl = generateUrl
