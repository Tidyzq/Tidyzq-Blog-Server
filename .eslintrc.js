// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'tidyzq',
  ],
}
