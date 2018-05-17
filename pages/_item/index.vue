<template>
  <main :class="mainClass" @click="toggleListShown">
    <aside class="alerts" :data-length="alerts.length">
      <div v-for="alert in alerts" class="alert">{{alert}}</div>
    </aside>

    <header>
      <h1 class="item-title">{{headerTitle}}</h1>
      <Player ref="player" :currentIndex="$store.state.currentIndex" />
    </header>

    <article v-swiper:swiper="swiperOption" class="swiper-container">
      <div class="swiper-wrapper">
        <section v-for="sample in $store.state.samples" :key="sample.id" class="swiper-slide" :data-hash="sample.id">
          <div class="swiper-zoom-container">
            <img v-if="sample.image" :src="imgSrc(sample)" :style="`height:${sample.image.h}px; width:${sample.image.w}px`" />
            <h1 v-else class="sample-title">{{sample.title}}</h1>
          </div>
        </section>
      </div>
      <div class="swiper-pagination" slot="pagination"></div>
      <div class="swiper-button-prev swiper-button" slot="button-prev"></div>
      <div class="swiper-button-next swiper-button" slot="button-next"></div>
    </article>

  </main>
</template>

<script>
import Player from '~/components/Player.vue';

import { mapMutations } from 'vuex';

import axios from 'axios';

// TODO: print option
// TODO: pagination

export default {
  components: {
    Player,
  },

  head () {
    const s = this.$store.state;
    const i = s.samples[s.currentIndex];

    return {
      title: (!i ? s.title : `(${i.id})${i.title ? ' ' + i.title : ''} • ${s.title}`),

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
        autoHeight: true,
        spaceBetween: 15, /*pixels*/
        zoom: true,
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

  computed: {
    s() {
      return this.$store.state;
    },

    p() {
      return this.$store.state.player;
    },

    mainClass() {
      return {
        'is-init':       this.$store.state.isInit,
        'is-loaded':     this.p.title,
        'is-list-shown': this.p.isListShown,
      }
    },

    headerTitle() {
      const s = this.$store.state;
      return !s.samples[s.currentIndex] ? 'loading...' : s.title;
    },

    alerts() {
      return this.$store.state.alert ? [this.$store.state.alert] : [];
    },

  }, // computed{}

  //====================================================================================================================

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.$ === 'undefined') return;
    this.init();
  }, // mounted()

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initSamples();
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    async initSamples() {
      const res = await axios.get(`${this.$store.state.urlBase}${this.$route.params.item}/?action=Samples`);
      if (!res.data.response.success) {
        return this.set({alert: res.data.response.message});
      }

      const samples = res.data.samples;

      this.set({
        title:   res.data.title,
        item:    this.$route.params.item,
        type:    res.data.type,
        samples: samples,
        firstId: samples[0].id,
        lastId:  samples[samples.length - 1].id,
      });

      this.update();

      this.set({isInit:true});
    }, // initSamples()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      //console.log('update() route...', this.$route.hash);

      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.$store.state.firstId])[0];

      const index = this.$store.state.samples.findIndex(i => i.id === id);

      if (index === -1) {
        return this.$router.replace('./');
      }

      this.set({currentIndex: index});

      if (this.swiper.activeIndex !== index) {
        this.swiper.slideTo(index);
      }

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}.${sample.image.ext}`;
    }, // imgSrc()

    //------------------------------------------------------------------------------------------------------------------

    toggleListShown(e) {

      if (e.target === window.$('.is-list-shown')[0]) {
        this.$store.commit('player/set', {isListShown: false});
      }

    }, // toggleListShown()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================
};
</script>

<style lang="scss">
@import "../../assets/settings.scss";

html {
  font-size: $base-size;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  min-height: 100%;
  background-color: $background-color;
  overflow-y: scroll; // always on to avoid possible jank when toggling playlist
}

main {
  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 650px; // based on sheet music size: 25 + 600 + 25
  margin: auto;
}

main:not(.is-init) .audio-player,
main:not(.is-init) .swiper-container {
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
  transition: all .2s ease;
  pointer-events: none;
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
  transition: all .2s ease-in-out;
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
  background-color: lighten($alert-color, 40%);
  font-size: 2rem;
  padding: .5em;
  min-width: 10em;
  max-width: 30em;
  transition: all .2s ease;
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
  @include short-transition;
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
  html[data-browser*="Edge"] & { // [2018-05-11] Edge cannot handle calc()
    background: linear-gradient(to right, $background-color, transparent 5%, transparent 94.5%, $background-color);
  }
}

.swiper-slide {
  user-select: none;
  cursor: default;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: white;
  min-height: 25vh;
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
  bottom: .5em;
  color: darken($alert-color, 25%);
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
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

</style>
