<template>
  <main :class="mainClass" :data-title="$_i.title" :data-dir="$_i.direction">
    <TheDebugger v-if="$_._showDebugger" />

    <TheAlerts />

    <TheSamples />

    <TheContext />

  </main>
</template>

<script>
import TheDebugger from '~/components/TheDebugger';
import TheAlerts   from '~/components/TheAlerts';
import TheSamples  from '~/components/TheSamples';
import TheContext  from '~/components/TheContext';

import settings from '~/assets/settings';
import mixins   from '~/plugins/mixins.vue';

import axios from 'axios';

export default {
  key: '_item', // ensure page doesn't get recreated on route change

  components: {
    TheDebugger,
    TheAlerts,
    TheSamples,
    TheContext,
  },

  head () {
    const s = this.$_i.samples[this.$_i.currentIndex];

    return {
      title: (s ? `(${s.id}) ${s.title || ''} • ` : '') + (this.$_i.title || 'Samples'),

      bodyAttrs: {
        class: this.$store.getters.uiStateClassString,
      },

      link: [
        this.$_i.type !== 'audio' ? {} :
          // audio speaker favicon
          {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  watch: {
    $route(to, from) {
      this.$store.commit('addToHistory', {code:from.params.item, index:this.$_i.currentIndex});
      this.update();
    }
  },

  data () {
    return {
    }
  }, // data()

  async asyncData({params, store, error}) {

    if (store.state.series.id) {
      return store.commit('series/set', {currentIndex: store.state.series.items.findIndex(s => s.code === params.item)});
    }

    if (!store.state.isInit) store.commit('set', {isDev: window.$nuxt.$cookies.get('dev')});

    const data = {
      data: null
    };

    const url = `${store.state.urlBase}${params.item}/?action=Data${store.state.isDev ? '&dev=true' : ''}`;

    try {
      const res = await axios.get(url);
      if (typeof res.data === 'string' || !res.data.response.success) throw {message:'No samples found.'};
      data.data = res.data;
    } catch (err) {
      console.log('error:',err);
      return error({ statusCode: (err.response && err.response.status || 500), message: (err.message || 'Oops! This page has a problem. :-('), url })
    }

    return data;
  }, // asyncData()

  computed: {

    $_() {
      return this.$store.state;
    },

    $_s() {
      return this.$store.state.series;
    },

    $_i() {
      return this.$store.state.item;
    },

    $_p() {
      return this.$store.state.player;
    },

    mainClass() {
      return {
        '-debug':      this.$_._showDebugger,
        'is-dev':      this.$_.isDev,
        'is-init':     this.$_.isInit,
        'has-touch':   this.$_.hasTouch,
        'has-mouse':   this.$_.hasMouse,
        'is-resizing': this.$_.isResizing,
        //TODO 'show-title':   true,
      }
    },

    itemShellClass() {
      return {
        'has-scrollbar-x': this.$_.hasScrollbarX && this.$_.scrollbarWidth,
        'has-scrollbar-y': this.$_.hasScrollbarY && this.$_.scrollbarWidth,
      }
    },

  }, // computed{}

  //====================================================================================================================

  async mounted() {
    console.time('index');
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.$ === 'undefined') return;

    window.addEventListener('resize', this.onResize);

    await this.$store.dispatch('initSettings');

    this.set({scrollbarWidth: this.getScrollbarWidth()});

    if (!this.$_.hasMouse) {
      const _firstmouseover = () => {
        this.set({hasMouse: true});
        window.removeEventListener('mouseover', _firstmouseover, false);
      };
      window.addEventListener('mouseover', _firstmouseover, false);
    }

    if (!this.$_.hasTouch) {
      const _firsttouchstart = () => {
        this.set({hasTouch: true});
        window.removeEventListener('touchstart', _firsttouchstart, false);
      };
      window.addEventListener('touchstart', _firsttouchstart, false);
    }

    this.initData();
  }, // mounted()

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize);
  },

  //====================================================================================================================

  methods: {

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

    onResize: function() {
      this.set({'isResizing': true});

      clearTimeout(this.tResize);

      this.tResize = setTimeout(() => {
        this.set({'isResizing': false});
      }, settings.TRANSITION_TIME_MS);
    }, // onResize()

    //------------------------------------------------------------------------------------------------------------------

    async initData() {
      if (this.data === undefined) return;

      const d      = this.data;
      const series = d.series;
      const items  = series.items;
      const item   = items[d.seriesIndex];

      const {maxH, maxHRatio} = this.initImagesData(items);

      this.set('series', {...series,
        currentIndex: d.seriesIndex,
        firstCode:    items[0].code,
        lastCode:     items[items.length - 1].code,
        maxH,
        maxHRatio,
      });

      await this.initItemData(item);

      this.set({
        isInit: true,
      });

      console.timeEnd('index');

      this.update();
    }, // initData()

    //------------------------------------------------------------------------------------------------------------------

    async initItemData(item) {

      if (this.$_i.code) {
        await this.$store.dispatch('item/unset');
      }

      const samples = item.samples;

      if (samples.length) {
        const {maxHRatio} = this.initImagesData(samples);

        item = {...item,
          direction: item.direction || 'ltr',
          hasRulers: item.type !== 'audio',
          hasZoom:   item.hasZoom  || false,
          hasPrint:  item.hasPrint || false,
          firstId:   samples[0].id,
          lastId:    samples[samples.length - 1].id,
          maxHRatio: maxHRatio,
        };
      }

      /*TODO: depends on what is currently in focus
      if (!samples.length) {
        return;
        //return this.$nuxt.error({statusCode: 404, message: 'No samples found.'});
      }
      //*/

      this.set('item', item);

    }, // initItemData()

    //------------------------------------------------------------------------------------------------------------------

    initImagesData(arr = []) {
      const _ = {
        maxH: null,
        maxHRatio: null,
      };

      for (const i of arr) {
        if (!i.image) continue;
        i.image.loaded = {}; // create object to monitor loaded state
        i.image.hRatio = i.image.h / i.image.w;
        if (_.maxHRatio === null || i.image.hRatio > _.maxHRatio) _.maxHRatio = i.image.hRatio;
        if (_.maxH === null || i.image.h > _.maxH) _.maxH = i.image.h;
      }

      return _;
    }, // initImagesData()

    //------------------------------------------------------------------------------------------------------------------

    getScrollbarWidth() {
      const i = document.createElement('p');
      i.style.width = "100%";
      i.style.height = "200px";

      const o = document.createElement('div');
      o.style.position = "absolute";
      o.style.top = "0px";
      o.style.left = "0px";
      o.style.visibility = "hidden";
      o.style.width = "200px";
      o.style.height = "150px";
      o.style.overflow = "hidden";
      o.appendChild(i);

      document.body.appendChild(o);
      const wI = i.offsetWidth;
      o.style.overflow = 'scroll';
      let wO = i.offsetWidth;
      if (wI === wO) wO = o.clientWidth;

      document.body.removeChild(o);

      return (wI - wO);
    }, // getScrollbarWidth()

    //------------------------------------------------------------------------------------------------------------------

    async update() {
      console.log('update() route', this.$route.path, this.$route.hash);

      if (this.$_i.code !== this.$route.params.item) {
        await this.initItemData(this.$_s.items[this.$_s.currentIndex]);
      }

      // original link system [until 2019] use sequential numbers for sample id (i.e., index + 1)
      const seq = +(this.$route.hash.match(/##(\d+)/) || [0,0])[1];

      if (seq && this.getRouteFromSequence(seq)) return;

      // if id is not given in the hash, select the first in the samples list
      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.$_i.firstId])[0];

      const index = this.$_i.samples.findIndex(i => i.id === id);

      // if id is not found, it may be an old-style url using #sequence instead of #id
      if (index === -1) {
        if (this.getRouteFromSequence(id)) return;
        return this.$router.replace('./');
      }

      this.set('item', {currentIndex: index});

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    getRouteFromSequence(seq) {
      const i = this.$_i.samples.find(i => i.index === seq - 1);
      if (i) this.$router.replace(`./#${i.id}`);
      return i !== undefined;
    }, // getIdFromSequence()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================
};
</script>

<style lang="scss">
@import "../../assets/settings.scss";

@include base_styling;

main {
  &:not(.error) {
    user-select: none; // expected to be more hindrance than useful in this app
  }
  position: relative;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: auto;
  //@include short-transition;

  &[data-dir="rtl"] {
    direction: rtl;
  }

  &.show-title::before {
    content: attr(data-title);
    z-index: $layer-title;
    @include absolute-center(fixed);
    max-width: 100vw;
    text-align: center;
    font-size: 3em;
    font-weight: bold;
    padding: 1em;
    border-radius: $radius / 3;
    background-color: white;
    color: $theme-color;
    box-shadow: 0 0 1em transparentize($theme-color, 0.5);
    pointer-events: none;
    animation: a-titlefade 3s 1 forwards ease-in-out;
  }

  &.is-dev::after {
    pointer-events: none;
    z-index: $layer-the-alerts;
    content: '*';
    color: red;
    position: absolute;
    left: 0;
    bottom: 0;
    font-size: 40px;
    line-height: 0;
  }
}

@keyframes a-titlefade {
  from {
    transform: translate(-50%, -50%) scale(0.5);
    opacity: 0;
  }
  10%, 75% {
    transform: translate(-50%, -50%) scale(1.0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, -50%) scale(1.0);
    opacity: 0;
  }
}

main:not(.is-init):not(.error) {
  pointer-events: none;
  opacity: 0;
}

</style>
