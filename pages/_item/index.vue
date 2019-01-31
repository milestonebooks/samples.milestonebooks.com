<template>
  <main :class="mainClass" :data-title="$_.title" :data-dir="$_i.direction">
    <TheDebugger v-if="$_._showDebugger" />

    <TheAlerts />

    <TheSamples v-if="true" />

    <TheContext v-if="true" />

  </main>
</template>

<script>
import TheDebugger from '~/components/TheDebugger';
import TheAlerts   from '~/components/TheAlerts';
import TheSamples  from '~/components/TheSamples';
import TheContext  from '~/components/TheContext';

import settings from '~/assets/settings';

import { mapMutations } from 'vuex';

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
        class: (this.$_.showContext ? 'show-context' : '') + (this.$_.isResizing ? 'is-resizing' : ''),
      },

      link: [
        // audio speaker favicon
        this.$_i.type !== 'audio' ? {} :
          {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  watch: {
    $route: 'update',
  },

  data () {
    return {
    }
  }, // data()

  async asyncData({params, store, error}) {
    console.log('asyncData()', params, 'state:', store.state.context.series.length);
    if (store.state.context.seriesId) {
      console.log('update series index!', store.state.context.series.length);
      store.commit('set', {context:{currentIndex: store.state.context.series.findIndex(s => s.item === params.item)}});
      //return;
    }

    const data = {
      data: null
    };
    // TODO: make sure Samples.php API is updated when updating production frontend
    const url = `${store.state.urlBase}${params.item}/?action=Data${document.cookie.match(/dev=true/) ? '&dev=true' : ''}`;

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

    $_i() {
      return this.$store.state.item;
    },

    $_p() {
      return this.$store.state.player;
    },

    mainClass() {
      return {
        'debug':        this.$_._showDebugger,
        'is-init':      this.$_.isInit,
        'show-context': this.$_.showContext,
        'has-touch':    this.$_.hasTouch,
        'has-mouse':    this.$_.hasMouse,
        'show-title':   true,
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

    this.set({scrollbarWidth: this.getScrollbarWidth() });

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

    ...mapMutations([
      'set',
    ]),
    ...mapMutations('item', {
      'setItem': 'set',
    }),

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

      const d = this.data;
      const series  = d.series;
      const item    = d.series.items[d.seriesIndex];
      const samples = item.samples;

      const {maxHRatio:series_maxHRatio} = this.initImagesData(series.items);
      const {maxHRatio:item_maxHRatio} = this.initImagesData(samples);

      this.setItem({
        isInit:    true,
        title:     item.title,
        code:      item.code,
        type:      item.type,
        direction: item.direction || 'ltr',
        hasRulers: item.type !== 'audio',
        hasZoom:   item.hasZoom  || false,
        hasPrint:  item.hasPrint || false,
        samples:   samples,
        firstId:   samples[0].id,
        lastId:    samples[samples.length - 1].id,
        maxHRatio: item_maxHRatio,
      });

      this.set({
        isInit: true,
        context: {
          seriesId:     series.id,
          currentIndex: d.seriesIndex,
          series:       series.items,
          maxHRatio:    series_maxHRatio,
        }
      });

      console.timeEnd('index');

      this.update();
    }, // initData()

    //------------------------------------------------------------------------------------------------------------------

    initImagesData(arr = []) {
      let maxHRatio = null;

      for (const i of arr) {
        if (!i.image) continue;
        i.image.loaded = {}; // create object to monitor loaded state
        i.image.hRatio = i.image.h / i.image.w;
        if (maxHRatio === null || i.image.hRatio > maxHRatio) maxHRatio = i.image.hRatio;
      }

      return {
        maxHRatio,
      };
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

    update() {
      console.log('update() route', this.$route);
      // original link system [until 2018] use sequential numbers for sample id (i.e., index + 1)
      const seq = +(this.$route.hash.match(/sample=(\d+)/) || [0,0])[1];

      if (seq && this.getRouteFromSequence(seq)) return;

      // if id is not given in the hash, select the first in the samples list
      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.$_i.firstId])[0];

      const index = this.$_i.samples.findIndex(i => i.id === id);

      // if id is not found, it may be an old-style url using #sequence instead of #id
      if (index === -1) {
        if (this.getRouteFromSequence(id)) return;
        return this.$router.replace('./');
      }

      this.setItem({currentIndex: index});

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

.shell {
  position: absolute;
  width: 100%; // % instead of vw to avoid potential h scrollbar
  height: 100vh;
  overflow: auto;
  @include short-transition;
}

.the-item-view {
  position: fixed;
  z-index: $layer-item-view; // above <.frame-mask> layer
  width: 100%;
  height: 100%;
  pointer-events: none;
  @include short-transition;

  > * {
    pointer-events: all;
  }

  @at-root .has-scrollbar-y & {
    width: calc(100% - 17px);
  }
  @at-root .has-scrollbar-x & {
    height: calc(100% - 17px);
  }
}

</style>
