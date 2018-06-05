module.exports = {
  env: {
    gtm: process.env.NODE_ENV === 'production'
  },

  // headers of the page
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
      // enable IE11 access
      { src: 'https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Array.prototype.includes,Array.prototype.find,Array.prototype.findIndex' },
      // cash (4.1KB) -- jquery substitute used by player <https://github.com/kenwheeler/cash>
      //{ src: 'https://cdn.jsdelivr.net/npm/cash-dom@1.3.7/dist/cash.min.js' },
      //{ src: 'https://cdn.jsdelivr.net/npm/howler@2.0.12/dist/howler.min.js' },
      { src: 'https://cdn.jsdelivr.net/combine/npm/cash-dom@1.3.7,npm/howler@2.0.12' }, // combined
      // <http://aslanbakan.com/en/blog/browser-and-device-specific-css-styles-with-sass-and-less-mixins/>
      { hid: 'ua', innerHTML: 'document.documentElement.setAttribute("data-browser", navigator.userAgent);', type: 'text/javascript' },
    ],
    __dangerouslyDisableSanitizers: ["script"],
  },

  plugins: [
    '~plugins/gtm.js',
    { src: '~plugins/storage.js', ssr: false },
  ],

  mode: 'spa',

  loadingIndicator: {
    color: 'hsl(0, 0%, 50%)',
    background: 'hsl(0, 0%, 95%)',
  },

  // customize the progress bar color
  loading: { color: '#c51' },

  // build configuration
  build: {
    // run ESLint on save
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

    // optimizes js and css bundles
    vendor: [
      'axios',
    ],

    extractCSS: true,
  },

  generate: {
    dir:        '_dist',
    subFolders: false,
    fallback:   true,

    routes: ['/_item'], // unique data is loaded client-side, so only one template is necessary
  },
};
