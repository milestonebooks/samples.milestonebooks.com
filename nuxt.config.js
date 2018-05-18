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
      // TODO: enable IE11 access
      { src: 'https://cdn.polyfill.io/v2/polyfill.min.js' },//?features=String.prototype.includes,Array.prototype.find,Promise' },
      // cash (4.1KB) -- jquery substitute used by player <https://github.com/kenwheeler/cash>
      { src:'https://cdn.jsdelivr.net/npm/cash-dom@1.3.7/dist/cash.min.js' },
      // <http://aslanbakan.com/en/blog/browser-and-device-specific-css-styles-with-sass-and-less-mixins/>
      { hid: 'ua', innerHTML: 'document.documentElement.setAttribute("data-browser", navigator.userAgent);', type: 'text/javascript' },
    ],
    __dangerouslyDisableSanitizers: ["script"],
  },

  // customize the progress bar color
  loading: { color: '#c51' },

  plugins: [
    '~plugins/gtm.js',
    { src: '~plugins/storage.js', ssr: false },
    { src: '~plugins/swiper.js', ssr: false },
  ],

  css: [
    'swiper/dist/css/swiper.css',
  ],

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

    async routes () {
      const routes = [];
      routes.push('/0-SONG', '/49-CD-HLCF', '/49-CD-JTW');
      //TODO: get dynamically from API <https://samples.milestonebooks.com/AudioSamples.php?action=Items>
      return routes;
    }
  },
};
