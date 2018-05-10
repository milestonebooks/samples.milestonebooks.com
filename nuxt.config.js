module.exports = {
  env: {
    gtm: false, // process.env.NODE_ENV === 'production'
  },
  /*
  ** Headers of the page
  */
  head: {
    title: 'samples.milestonebooks.com',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'audio samples of CDs available through Milestone Books' }
    ],
    link: [
      { hid: 'favicon', rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.0/normalize.min.css' },
    ],
    script: [
      // cash (4.1KB) -- jquery substitute used by player <https://github.com/kenwheeler/cash>
      { src:'https://cdn.jsdelivr.net/npm/cash-dom@1.3.7/dist/cash.min.js' },
    ],
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#c51' },

  plugins: [
    '~plugins/gtm.js',
    { src: '~plugins/swiper.js', ssr: false },
  ],

  css: [
    'swiper/dist/css/swiper.css',
  ],

  /*
  ** Build configuration
  */
  build: {
    analyze: {
      analyzerMode: (process.env.NODE_ENV === 'production' ? 'disabled' : 'server')
    },

    /*
    ** Run ESLint on save
    */
    extend (config, ctx) {
      if (ctx.dev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    },

    vendor: [
      'axios',
    ],
  },

  generate: {
    dir:        '_dist',
    subFolders: false,
    fallback:   true,

    routes () {
      const routes = [];
      routes.push('/audio/0-SONG');
      //let books = require('./static/api/books.json'); // `import` triggers "SyntaxError: Unexpected token import" as of 2017-05
      return routes;
    }
  },
};
