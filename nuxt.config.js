// v1.0.1        gzipped size: 82.93 KB
// v1.1.0        gzipped size: 80.43 KB
// v2.0.0-beta.0 gzipped size: 82.65 KB
// v2.0.0-beta.3 gzipped size: 75.81 KB
// v2.0.0-beta.5 gzipped size: 78.90 KB
// v2.0.0        gzipped size: 80.94 KB
// v2.1.1        gzipped size: 81.33 KB
// v2.2.0        gzipped size: 85.19 KB
// v2.2.2        gzipped size: 91.92 KB
// v2.2.3        gzipped size: 95.99 KB
// TODO: implement behavior analytics (low priority)
// TODO: [bug] Source map error: request failed with status 404 | Resource URL: http://localhost:3000/_nuxt/modern-vendors.app.js

export default {
  env: {
    tracking: (process.env.NODE_ENV === 'production'),
  },

  // headers of the page
  head: {
    title: 'samples.milestonebooks.com',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, minimum-scale=1' },
      { hid: 'description', name: 'description', content: 'samples of products available from Milestone Books' }
    ],
    link: [
      { hid: 'favicon', rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.0/normalize.min.css' },
    ],
    script: [
      // enable IE11 access
      { src: 'https://cdn.polyfill.io/v2/polyfill.min.js?features=default,Array.prototype.includes,Array.prototype.find,Array.prototype.findIndex,IntersectionObserver' },
      //{ src: 'https://cdn.jsdelivr.net/npm/cash-dom@1.3.7/dist/cash.min.js' },  // (4.1 KB) -- jquery substitute used by player <https://github.com/kenwheeler/cash>
      //{ src: 'https://cdn.jsdelivr.net/npm/howler@2.0.15/dist/howler.min.js' }, // (9.3 KB) -- sound <https://github.com/goldfire/howler.js>
      //{ src: 'https://cdn.jsdelivr.net/npm/animejs@2.2.0/anime.min.js' },       // (6.5 KB) -- animations <http://animejs.com/documentation/> [2018-10-23] NOT USED
      { src: 'https://cdn.jsdelivr.net/combine/npm/cash-dom@1.3.7,npm/howler@2.0.15' }, // combined
      // <http://aslanbakan.com/en/blog/browser-and-device-specific-css-styles-with-sass-and-less-mixins/>
      { hid: 'ua', innerHTML: 'document.documentElement.setAttribute("data-browser", navigator.userAgent);', type: 'text/javascript' },
      { hid: 'env', innerHTML: `document.documentElement.setAttribute("data-env", "${process.env.NODE_ENV}");`, type: 'text/javascript' },
    ],
    __dangerouslyDisableSanitizers: ["script"],
  },

  plugins: [
    '~plugins/tracking.js',
    '~plugins/storage.client.js',
  ],

  modules: [
    'cookie-universal-nuxt',
    'nuxt-vuex-router-sync',
  ],

  ssr: false,

  modern: 'client',

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

    extractCSS: true,
    // disable these css optimizations to avoid corrupting data-uri svgs (see TheSlider.vue)
    optimizeCSS: false,
    postcss: {
      plugins: {
        cssnano: {
          preset: [
            'default', {
              svgo: false,
            }]
        },
      }
    }
  },

  generate: {
    dir:        '_dist',
    subFolders: false,
    fallback:   true,

    routes: ['/_item'], // unique data is loaded client-side, so only one template is necessary
  },

  target: 'static',
};
