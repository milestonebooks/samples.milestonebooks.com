module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'samples2',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.min.css' },
    ],
    script: [
      // zepto (9.9KB)  -- jquery substitute used by player <http://zeptojs.com/>
      // howler (8.6KB) -- audio library used by player <https://howlerjs.com/>
      { src:'https://cdn.jsdelivr.net/combine/npm/zepto@1.2.0,npm/howler@2.0.5' },
    ],
  },
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
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
    }
  }
};
