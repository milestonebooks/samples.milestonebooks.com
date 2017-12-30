module.exports = {
  root: true,
  parser: 'babel-eslint',
  env: {
    browser: true,
    node: true
  },
  extends: 'standard',
  // required to lint *.vue files
  plugins: [
    'html'
  ],
  // add your custom rules here
  rules: {
    'key-spacing':    ['off'],
    'comma-dangle':   ['off'],
    'comma-spacing':  ['off'],
    'semi':           ['off'],
    'padded-blocks':  ['off'],
    'spaced-comment': ['off'],
    'space-before-function-paren': ['off'],
    'space-before-blocks':         ['off'],

    'indent':                ['warn'],
    'no-constant-condition': ['warn'],
    'no-undef':              ['warn'],
    'no-extra-boolean-cast': ['warn'],
    'no-extra-parens':       ['warn'],
    'no-unused-vars':        ['warn'],
    'no-unreachable':        ['warn'],
  },
  globals: {}
};
