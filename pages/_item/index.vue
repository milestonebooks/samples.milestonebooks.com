<template>
  <main :class="mainClass" :data-type="s.type" :data-title="s.title">
    <aside class="alerts" :data-length="alerts.length">
      <div v-for="alert in alerts" class="alert">{{alert}}</div>
    </aside>

    <TheSlider :options="{ enableMouseEvents: true}" :samples="s.samples" :currentIndex="s.currentIndex" />

    <TheNav v-if="s.samples.length > 1" />

    <ThePlayer ref="player" v-if="s.type === 'audio'" :currentIndex="s.currentIndex" />

  </main>
</template>

<script>
import TheSlider from '~/components/TheSlider';
import TheNav    from '~/components/TheNav';
import ThePlayer from '~/components/ThePlayer';

import { mapMutations } from 'vuex';

import axios from 'axios';

// TODO: print option
// TODO: enable IE 11 (can't understand flexbox)

export default {
  components: {
    TheSlider,
    TheNav,
    ThePlayer,
  },

  head () {
    const i = this.s.samples[this.s.currentIndex];

    return {
      title: (!i ? this.s.title : `(${i.id})${i.title ? ' ' + i.title : ''} • ${this.s.title}`),

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
      hasTouch: false,
      hasHover: false,
      optionsMode: true,
    };
  }, // data()

  async asyncData({params, store, error}) {
    const data = {
      data: null
    };
    const url = `${store.state.urlBase}${params.item}/?action=Data&dev=true`; // TODO dev mode

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
        'is-init':      this.s.isInit,
        'has-touch':    this.hasTouch,
        'has-hover':    this.hasHover,
        'options-mode': this.optionsMode,
        'show-title':   true,
      }
    },

    alerts() {
      return this.s.alert ? [this.s.alert] : [];
    },

  }, // computed{}

  //====================================================================================================================

  mounted() {
    console.time('index');
    console.time('Player');
    console.time('Slider');
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.$ === 'undefined') return;

    const _firstmouseover = () => {
      this.hasHover = true;
      window.removeEventListener('mouseover', _firstmouseover, false);
    };
    window.addEventListener('mouseover', _firstmouseover, false);

    const _firsttouchstart = () => {
      this.hasTouch = true;
      window.removeEventListener('touchstart', _firsttouchstart, false);
    };
    window.addEventListener('touchstart', _firsttouchstart, false);

    // toggle options visibility on small screens
    window.addEventListener('click', () => this.optionsMode = !this.optionsMode);

    setTimeout(() => {
      this.optionsMode = false;
    }, 2000);

    this.initSamplesData();
  }, // mounted()

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    async initSamplesData() {
      const samples = this.data.samples;

      this.set({
        isInit:  true,
        title:   this.data.title,
        item:    this.$route.params.item,
        type:    this.data.type,
        samples: samples,
        firstId: samples[0].id,
        lastId:  samples[samples.length - 1].id,
      });

      console.timeEnd('index');

      this.update();
    }, // initSamplesData()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      // original link system [until 2018] use sequential numbers for sample id (i.e., index + 1)
      const seq = +(this.$route.hash.match(/sample=(\d+)/) || [0,0])[1];

      // replace url with the sample id
      if (seq) {
        const i = this.s.samples.find(i => i.index === seq - 1);
        if (i) return this.$router.replace(`./#${i.id}`);
      }

      // if id is not given in the hash, select the first in the samples list
      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.s.firstId])[0];

      const index = this.s.samples.findIndex(i => i.id === id);

      // if id is not found, return to default
      if (index === -1) {
        return this.$router.replace('./');
      }

      this.set({currentIndex: index});

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}.${sample.image.ext}`;
    }, // imgSrc()

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

  &::before {
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
  }

  &.show-title::before {
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

main:not(.is-init) {
  pointer-events: none;
  opacity: 0;
}

.glue {
  white-space: nowrap;
}

.alerts {
  z-index: $layer-alerts;
  pointer-events: none; // continue to allow interaction
  position: fixed;
  left: 0;
  top: 0;
  height: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @include short-transition;
}
.alerts:not([data-length="0"]) {
  height: 100%;
}

.alert {
  position: relative;
  align-self: center;
  box-sizing: border-box;
  margin: .5em;
  border: 1px solid $alert-color;
  box-shadow: 0 .25em 1em #999;
  background-color: $alert-bg-color;
  font-size: 2rem;
  padding: .5em;
  min-width: 10em;
  max-width: 30em;
  @include short-transition;
}

</style>
