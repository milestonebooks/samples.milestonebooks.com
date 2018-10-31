/* eslint-disable */

import {state} from '../store/index.js';

if (process.browser && process.env.tracking) {
  // include Google Tag Manager
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});let f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!=='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer',state().gtmID);

  // include ProvideSupport.com Monitor
  (function() {
    let s = document.createElement('script');
    s.src = `https://image.providesupport.com/js/${state().psID}/safe-monitor.js?ps_h=0aMa&ps_t=${new Date().getTime()}`;
    document.body.appendChild(s);
  })();
}
