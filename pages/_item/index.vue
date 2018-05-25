<template>
  <main :class="mainClass" @click="onMaskClick">
    <aside class="alerts" :data-length="alerts.length">
      <div v-for="alert in alerts" class="alert">{{alert}}</div>
    </aside>

    <header>
      <h1 class="item-title">{{headerTitle}}</h1>
      <Player ref="player" :currentIndex="s.currentIndex" />
    </header>

    <article v-swiper:swiper="swiperOption" class="swiper-container">
      <div class="swiper-wrapper">
        <section v-for="sample in s.samples" :key="sample.id" class="swiper-slide" :data-hash="sample.id">
          <div class="swiper-zoom-container">
            <img v-if="sample.image" :src="imgSrc(sample)" :style="`height:${sample.image.h}px; width:${sample.image.w}px`" />
            <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
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

      if (this.swiper.activeIndex !== index) {
        this.swiper.slideTo(index);
      }

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
  background-color: $alert-bg-color;
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

</style>
