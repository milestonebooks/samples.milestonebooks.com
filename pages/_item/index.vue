<template>
  <main :class="mainClass" :data-dir="$_i.direction" :data-version="version" :data-dev="dev">
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

import settings  from '~/assets/settings';
import mixins    from '~/plugins/mixins.vue';

import p from '../../package';

import axios from 'axios';

import { mapMutations } from 'vuex';

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
      title: (s && this.$store.getters.isShowSamples ? `(${s.id}) ${s.title || ''} • ` : '') + (this.$_i.title || 'Samples'),

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
      this.addToHistory({code:from.params.item});
      this.update();
    },
  },

  beforeRouteUpdate(to, from, next) {
    // TODO make route-driven transitions, refactor:
    // - AppSlider->showSamples()
    // - TheOptContext->showContext()
    // - SeriesLink->goTo()

    //console.log('beforeRouteUpdate() ', this.$store.state.popstate ? 'popped!' : '', '\nfrom:', from, '\nto:  ', to);

    if (this.$store.state.popstate && to.path === from.path && to.hash && !from.hash) {
      this.$store.commit('set', {request: 'showSamples'});
    }

    if (this.$store.state.popstate) this.set({'popstate': false});

    next();
  },

  data () {
    let version = `${p.version} | nuxt@${p.dependencies.nuxt}`;
    return {
      version,
      dev: this.$store.state.isDev ? `__ ${version}` : '',
    }
  }, // data()

  async asyncData({params, store, error}) {

    if (store.state.series.id) {
      let index = store.state.series.items.findIndex(s => s.code === params.item);

      // this happens when routing to a set (isGroup:true) item
      if (index === -1) {
        if (store.state.uiStateShow === 'samples') {
          return store.commit('set', {request: 'showContext'});
        }

        index = 0;
      }

      return store.commit('series/set', {currentIndex: index});
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

    window.addEventListener('popstate', this.onPopState);

    this.initData();
  }, // mounted()

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('popstate', this.onPopState);
  },

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    addToHistory: mixins.addToHistory,

    //------------------------------------------------------------------------------------------------------------------

    onResize: function() {
      this.set({'isResizing': true});

      clearTimeout(this.tResize);

      this.tResize = setTimeout(() => {
        this.set({'isResizing': false});
      }, settings.TRANSITION_TIME_MS);
    }, // onResize()

    //------------------------------------------------------------------------------------------------------------------

    onPopState: function() {
      this.set({'popstate': true});
    }, // onPopState()

    //------------------------------------------------------------------------------------------------------------------

    async initData() {
      if (this.data === undefined) return;

      const d      = this.data;
      const series = d.series;
      const items  = series.items;
      const item   = items[d.seriesIndex];

      const {maxW, maxH, maxHRatio} = this.initImagesData(items);

      this.set('series', {...series,
        currentIndex: d.seriesIndex,
        firstCode:    items[0].code,
        lastCode:     items[items.length - 1].code,
        maxW,
        maxH,
        maxHRatio,
      });

      await this.initItemData(item);

      this.uiStateClass({show: ((d.isGroup && items.length > 1) || !item.samples.length ? 'context' : 'samples')});

      await this.update();

      this.set({isInit: true});

      console.timeEnd('index');
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
      } else {
        // TODO
        if (this.$store.getters.isSamplesShown) {
          this.$store.commit('set', {request: 'showContext'});
        }
      }

      this.set('item', item);

    }, // initItemData()

    //------------------------------------------------------------------------------------------------------------------

    initImagesData(arr = []) {
      const _ = {
        maxW: null,
        maxH: null,
        maxHRatio: null,
      };

      for (const i of arr) {
        if (!i.image) continue;
        i.image.loaded = {}; // create object to monitor loaded state
        i.image.hRatio = i.image.h / i.image.w;
        if (_.maxW === null || i.image.w > _.maxW) _.maxW = i.image.w;
        if (_.maxH === null || i.image.h > _.maxH) _.maxH = i.image.h;
        if (_.maxHRatio === null || i.image.hRatio > _.maxHRatio) _.maxHRatio = i.image.hRatio;
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
      console.log('update() route', this.$route.path, this.$route.hash, `[${this.$_s.currentIndex}]`);

      if (this.$_i.code !== this.$route.params.item) {
        const item = this.$_s.items[this.$_s.currentIndex];

        if (!this.$_.isInit) return this.$router.replace(`/${item.code}/`);

        await this.initItemData(item);
      }

      let hash = this.$route.hash;

      const regexAutoPlay = /#auto-next|#autoplay/;

      // #auto-next was used in the pre-2019 system
      if (hash.match(regexAutoPlay)) {
        this.set('player', {isAutoPlay:true});
        hash = hash.replace(regexAutoPlay, '');
      }

      if (this.$store.getters.isSamplesShown && !hash) {
        if (!this.$_.isInit) {
          return this.$router.replace(`./#${this.$_i.firstId}`);
        } else {
          return this.$store.commit('set', {request: 'showContext'});
        }
      }

      // original link system [default until 2019] uses sequential numbers for sample id (i.e., index + 1)
      const seq = +(hash.match(/##(\d+)/) || [0,0])[1];

      if (seq && this.getRouteFromSequence(seq)) return;

      // if id (compare with server-side regex) is not given in the hash, select the first in the samples list
      const id = (hash.match(/[\w-]+/) || [this.$_i.firstId])[0];

      let index = this.$_i.samples.findIndex(i => i.id === id);

      // if id is not found, it may be an old-style url using #sequence instead of #id
      if (index === -1) {
        if (this.getRouteFromSequence(id)) return;
        index = 0;
        this.$router.replace('./');
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

  &[data-dir="rtl"] {
    direction: rtl;
  }

  &.is-dev::after {
    pointer-events: none;
    z-index: $layer-the-alerts;
    content: attr(data-dev);
    white-space: nowrap;
    position: absolute;
    left: 0;
    top: 0;
    width: 1em;
    height: 1em;
    color: gray;
    background-color: red;
  }
}

main {
  transition: opacity 1s ease-in-out;
}
main:not(.is-init):not(.error) {
  pointer-events: none;
  opacity: 0;
}

</style>
