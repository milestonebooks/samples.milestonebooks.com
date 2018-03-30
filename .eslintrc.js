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
    'one-var':        ['off'],
    'key-spacing':    ['off'],
    'comma-dangle':   ['off'],
    'comma-spacing':  ['off'],
    'semi':           ['off'],
    'padded-blocks':  ['off'],
    'spaced-comment': ['off'],
    'no-multi-spaces':['off'],
    'camelcase':      ['off'],
    'space-in-parens':['off'],
    'space-before-function-paren': ['off'],
    'space-before-blocks':         ['off'],
    'no-trailing-spaces':          ['off'],

    'prefer-const':            ['warn'],
    'eqeqeq':                  ['warn'],
    'indent':                  ['warn'],
    'new-parens':              ['warn'],
    'no-constant-condition':   ['warn'],
    'no-undef':                ['warn'],
    'no-extra-boolean-cast':   ['warn'],
    'no-extra-parens':         ['warn'],
    'no-unused-vars':          ['warn'],
    'no-unreachable':          ['warn'],
    'space-infix-ops':         ['warn'],
    'no-multiple-empty-lines': ['warn'],
    'handle-callback-err':     ['warn'],
  },
  globals: {}
};
