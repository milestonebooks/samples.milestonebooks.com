<template>
  <main :class="mainClass" :data-type="s.type" :data-title="s.title" :data-dpi="s.dpi" :data-dir="s.direction">
    <TheAlerts />

    <article class="the-item shell" :class="itemShellClass">
      <TheSlider :samples="s.samples" :currentIndex="s.currentIndex" />

      <div class="the-item-view">
        <TheOptRulers v-if="s.hasRulers" />

        <TheOptPrint v-if="s.hasPrint" />

        <TheNav v-if="s.samples.length > 1" />

        <ThePlayer v-if="s.type === 'audio'" :currentIndex="s.currentIndex" />

        <TheOptRevert v-if="s.type === 'items'" />
      </div>
    </article>

    <!--TheContext :series="s.context.series" :currentIndex="s.context.currentIndex" /-->

  </main>
</template>

<script>
import TheAlerts    from '~/components/TheAlerts';
import TheSlider    from '~/components/TheSlider';
import TheOptRulers from '~/components/TheOptRulers';
import TheOptPrint  from '~/components/TheOptPrint';
import TheOptRevert from '~/components/TheOptRevert';
import TheContext   from '~/components/TheContext';
import TheNav       from '~/components/TheNav';
import ThePlayer    from '~/components/ThePlayer';

import { mapMutations } from 'vuex';

import axios from 'axios';

// v1.0.1 gzipped size: 82.93 KB
// v1.1.0 gzipped size: 80.43 KB
// TODO: prev/next item in series
// TODO: provide info/exit button in upper right to help with contextual awareness
// TODO: implement behavior analytics (low priority)

export default {
  components: {
    TheAlerts,
    TheSlider,
    TheOptRulers,
    TheOptPrint,
    TheOptRevert, // TODO: temporary
    TheContext,
    TheNav,
    ThePlayer,
  },

  head () {
    const i = this.s.samples[this.s.currentIndex];

    return {
      title: (!i ? this.s.title : `(${i.id})${i.title ? ' ' + i.title : ''} • ${this.s.title}`),

      bodyAttrs: {
        class: (this.s.showContext ? 'show-context' : '')
      },

      link: [
        // audio speaker favicon
        this.s.type !== 'audio' ? {} :
          {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  watch: {
    $route: 'update',
  },

  data () {
    return {
    };
  }, // data()

  async asyncData({params, store, error}) {
    const data = {
      data: null
    };
    const url = `${store.state.urlBase}${params.item}/?action=Data${document.cookie.match(/dev=true/) ? '&dev=true' : ''}`;

    try {
      const res = await axios.get(url);
      if (typeof res.data === 'string' || !res.data.response.success || !res.data.samples.length) throw {message:'No samples found.'};
      data.data = res.data;
    } catch (err) {
      console.log('error:',err);
      return error({ statusCode: (err.response && err.response.status ? err.response.status : 500), message: (err.message ? err.message : 'Oops! This page has a problem. :-('), url })
    }

    return data;
  }, // asyncData()

  computed: {
    s() {
      return this.$store.state;
    },

    p() {
      return this.$store.state.player;
    },

    mainClass() {
      return {
        'is-init':     this.s.isInit,
        'has-touch':   this.s.hasTouch,
        'has-mouse':   this.s.hasMouse,
        'has-zoom':    this.s.hasZoom,
        'has-print':   this.s.hasPrint,
        'show-rulers': this.s.hasRulers && this.s.showRulers,
        'is-printing': this.s.isPrinting,
        'show-context': this.s.showContext,
        'show-title':  true,
      }
    },

    itemShellClass() {
      return {
        'has-scrollbar-x': this.s.hasScrollbarX && this.s.scrollbarWidth,
        'has-scrollbar-y': this.s.hasScrollbarY && this.s.scrollbarWidth,
      }
    },

  }, // computed{}

  //====================================================================================================================

  async mounted() {
    console.time('index');
    console.time('Player');
    console.time('Slider');
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.$ === 'undefined') return;

    await this.$store.dispatch('initSettings');

    this.set({scrollbarWidth: this.getScrollbarWidth() });

    if (!this.s.hasMouse) {
      const _firstmouseover = () => {
        this.set({hasMouse: true});
        window.removeEventListener('mouseover', _firstmouseover, false);
      };
      window.addEventListener('mouseover', _firstmouseover, false);
    }

    if (!this.s.hasTouch) {
      const _firsttouchstart = () => {
        this.set({hasTouch: true});
        window.removeEventListener('touchstart', _firsttouchstart, false);
      };
      window.addEventListener('touchstart', _firsttouchstart, false);
    }

    this.initSamplesData();
  }, // mounted()

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    async initSamplesData() {
      const d = this.data;
      const samples = d.samples;
      const series  = d.series;

      const {maxHRatio} = this.initImagesData(samples);
      const {maxHRatio:maxHRatioSeries} = this.initImagesData(series);

      this.set({
        isInit:    true,
        title:     d.title,
        item:      this.$route.params.item,
        type:      d.type,
        direction: d.direction || 'ltr',
        hasRulers: d.type !== 'audio',
        hasZoom:   d.hasZoom  || false,
        hasPrint:  d.hasPrint || false,
        samples:   samples,
        firstId:   samples[0].id,
        lastId:    samples[samples.length - 1].id,
        maxHRatio: maxHRatio,
        context: {
          currentIndex: series.findIndex(s => s.item === this.$route.params.item),
          series:       series,
          maxHRatio:    maxHRatioSeries,
        }
      });

      console.timeEnd('index');

      this.update();
    }, // initSamplesData()

    //------------------------------------------------------------------------------------------------------------------

    initImagesData(arr) {
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
      // original link system [until 2018] use sequential numbers for sample id (i.e., index + 1)
      const seq = +(this.$route.hash.match(/sample=(\d+)/) || [0,0])[1];

      if (seq && this.getRouteFromSequence(seq)) return;

      // if id is not given in the hash, select the first in the samples list
      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.s.firstId])[0];

      const index = this.s.samples.findIndex(i => i.id === id);

      // if id is not found, it may be an old-style url using #sequence instead of #id
      if (index === -1) {
        if (this.getRouteFromSequence(id)) return;
        return this.$router.replace('./');
      }

      this.set({currentIndex: index});

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    getRouteFromSequence(seq) {
      const i = this.s.samples.find(i => i.index === seq - 1);
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
  user-select: none; // expected to be more hindrance than useful in this app
  position: relative;
  display: flex;
  flex-direction: column;
  margin: auto;
  @include short-transition;

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
}

.the-item-view {
  position: fixed;
  z-index: 2; // above <.frame-mask> layer
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
