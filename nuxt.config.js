module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'samples2',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'audio samples of CDs available through Milestone Books' }
    ],
    link: [
      { hid: 'favicon', rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css' },
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

  /*
  ** Build configuration
  */
  build: {
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
      'vue-images-loaded',
    ],
  }
};
