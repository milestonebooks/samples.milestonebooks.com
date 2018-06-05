<template>
  <main :class="mainClass" @click="onMaskClick">
    <aside class="alerts" :data-length="alerts.length">
      <div v-for="alert in alerts" class="alert">{{alert}}</div>
    </aside>

    <header>
      <h1 class="item-title">{{headerTitle}}</h1>
      <Player ref="player" :currentIndex="s.currentIndex" />
    </header>

    <Slider :options="{ enableMouseEvents: true}" :samples="s.samples" :currentIndex="s.currentIndex" />

  </main>
</template>

<script>
import Player from '~/components/Player.vue';

import Slider from '~/components/Slider';

import { mapMutations } from 'vuex';

import axios from 'axios';

// TODO: print option

export default {
  components: {
    Player,
    Slider,
  },

  head () {
    const i = this.s.samples[this.s.currentIndex];

    return {
      title: (!i ? this.s.title : `(${i.id})${i.title ? ' ' + i.title : ''} • ${this.s.title}`),

      link: [
        // audio speaker favicon
        {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  watch: {
    $route: 'update',
  },

  data () {
    return {
      swiperOption: {
        speed: 250,
        autoHeight: true,
        spaceBetween: 15, // pixels
        zoom: true,
        grabCursor: true, // [2018-05-25] a little glitchy on Chrome
        a11y: {
          prevSlideMessage:  'Previous sample',
          nextSlideMessage:  'Next sample',
          firstSlideMessage: 'This is the first sample',
          lastSlideMessage:  'This is the last sample',
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev',
        },
        hashNavigation: {
          watchState: true,
          replaceState: true,
        },
        on: {
          slideChange() {
            window.$nuxt.$router.replace(`#${window.$nuxt.$store.state.samples[this.activeIndex].id}`);
          },
        }
      }, // swiperOption {}
    };
  }, // data()

  async asyncData({params, store, error}) {
    const data = {
      data: null
    };
    const url = `${store.state.urlBase}${params.item}/?action=Samples`;

    try {
      const res = await axios.get(url);
      if (typeof res.data === 'string' || !res.data.samples.length) throw {response:{status:500}};
      data.data = res.data;
    } catch (err) {
      console.log('error:',err);
      return error({ statusCode: err.response.status, message: 'Oops! This page has a problem. :-(', url })
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
        'is-init':       this.s.isInit,
        'is-list-shown': this.p.isListShown,
      }
    },

    headerTitle() {
      return !this.s.samples[this.s.currentIndex] ? 'loading...' : this.s.title;
    },

    alerts() {
      return this.s.alert ? [this.s.alert] : [];
    },

  }, // computed{}

  //====================================================================================================================

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.$ === 'undefined') return;

    /*
    const lory = this.$refs.lory.$el;
    console.log('index.vue mounted()');
    //slider.addEventListener('on.lory.touchend',  i => { console.log('touchend...', i) });
    //slider.addEventListener('before.lory.slide', i => { console.log('before...', i) });
    lory.addEventListener('after.lory.slide',  e => { console.log('after...',  e.detail, lory) });

    this.$refs.lory.slider.next();
    //*/

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

      this.update();
    }, // initSamplesData()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      // if id is not given in the hash, select the first in the samples list
      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.s.firstId])[0];

      const index = this.s.samples.findIndex(i => i.id === id);

      // if id is not found, return to default
      if (index === -1) {
        return this.$router.replace('./');
      }

      this.set({currentIndex: index});

      this.$refs.player.hideList();

      /* TODO: temp
      if (this.swiper.activeIndex !== index) {
        this.swiper.slideTo(index);
      }
      //*/

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}.${sample.image.ext}`;
    }, // imgSrc()

    //------------------------------------------------------------------------------------------------------------------

    onMaskClick(e) {
      if (e.target === window.$('.is-list-shown')[0]) this.$refs.player.hideList();
    }, // onMaskClick()

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
  max-width: 650px; // based on sheet music size: 25 + 600 + 25
  margin: auto;
  @include short-transition;
}

main:not(.is-init) {
  pointer-events: none;
  opacity: 0;
}

main::before {
  content: '';
  position: fixed;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: $layer-header - 1; /* below header, above swiper */
  opacity: 0;
  pointer-events: none;
  @include short-transition;
}
main.is-list-shown::before {
  opacity: .5;
  pointer-events: auto;
}

.glue {
  white-space: nowrap;
}

.alerts {
  z-index: $layer-alerts;
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

header {
  z-index: $layer-header;
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow;
}

.item-title {
  font-size: 1.8em;
  margin: 0;
  padding: 0.5em;
  text-align: center;
  color: $theme-color;
  @include one-line-ellipsis;
}

.swiper-container {
  margin-top: $unit/4;
  width: 100%;
  margin-left: -$unit;
  padding-left: $unit;
  margin-right: -$unit;
  padding-right: $unit;
}

.swiper-container::before { // mask for prev/next slide fades
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2; // raise above prev/next slides
  pointer-events: none;
  background: linear-gradient(to right, $background-color, transparent $unit, transparent calc(100% - #{$unit}), $background-color);
  // [2018-05-29] IE11 and Edge cannot handle calc()
  html[data-browser*="Trident"] &,
  html[data-browser*="Edge"] & {
    background: linear-gradient(to right, $background-color, transparent 5.5%, transparent 94.5%, $background-color);
  }
}

.swiper-slide {
  user-select: none;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  min-height: 50vh;
}

.swiper-slide::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border: 1px solid hsl(0, 0%, 60%);
}

.swiper-slide img {
  //min-width: 200px; // to display background loading message
  //background: white url('https://samples.milestonebooks.com/_img/loading.gif') no-repeat center;
  object-position: top;
}

.swiper-slide-active {
  overflow: hidden;
}

.swiper-zoom-container::after {
  position: absolute;
  content: 'COPYRIGHTED MATERIAL';
  white-space: nowrap;
  bottom: .5em;
  color: darken($alert-color, 25%);
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
  @include absolute-center(x);
}

.swiper-button {
  margin-top: 0;
  transform: translateY(-50%);
  height: 7em;
  width: 3.5em;
  background-color: hsla(0, 100%, 100%, .9);
  @include short-transition;
}
.swiper-button:hover {
  background-color: hsla(0, 100%, 100%, .9);
}

.swiper-button-prev, .swiper-container-rtl .swiper-button-next {
  left: .5em;
  border-radius: 1em 0 0 1em;
}
.swiper-button-next, .swiper-container-rtl .swiper-button-prev {
  right: .5em;
  border-radius: 0 1em 1em 0;
}

.swiper-button-disabled {
  opacity: .1 !important;
}

.sample-title {
  font-size: 2.5em;
}
.sample-title::after {
  content: '';
  display: block;
  width: 100%;
  margin-top: 5vh;
  height: 20vh;
  // audio icon sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M0,6 v6 h4 l5,5 v-16 l-5,5 h-4 z' /%3E%3Cpath d='M13.5,9 c0,-1.8 -1,-3.3 -2.5,-4 v8 c1.5,-0.7 2.5,-2.2 2.5,-4 z' /%3E%3Cpath d='M11,.2 v2 c3,1 5,3.6 5,6.8 s-2,5.8 -5,6.7 v2 c4,-0.8 7,-4.4 7,-8.7 s-3,-8 -7,-8.8 z' /%3E%3C/svg%3E");
  opacity: .05;
}

</style>
