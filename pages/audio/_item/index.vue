<template>
  <main :class="mainClass" @click="toggleListShown">
    <aside class="alerts" :data-length="alerts.length">
      <div v-for="alert in alerts" class="alert">{{alert}}</div>
    </aside>

    <header>
      <h1 class="item-title">{{headerTitle}}</h1>
      <Player ref="player" :currentIndex="$store.state.currentIndex" />
    </header>

    <article v-swiper:swiper="swiperOption">
      <div class="swiper-wrapper">
        <section class="swiper-slide" v-for="sample in $store.state.samples" :data-hash="sample.id">
          <img v-if="sample.image" :src="sample.image['@']" />
          <h1 v-else class="sample-title">{{sample.title}}</h1>
        </section>
      </div>
      <div class="swiper-pagination" slot="pagination"></div>
      <div class="swiper-button-prev swiper-button" slot="button-prev"></div>
      <div class="swiper-button-next swiper-button" slot="button-next"></div>
      <div class="copyright">COPYRIGHTED MATERIAL</div>
    </article>

    <!--section :class="['info']">
      <div v-if="p.current.score" :class="['score', scoreClass]" :title="scoreTip" v-images-loaded:on.progress="imageProgress" @click="print">
        <img :src="p.current.score" />
        <div class="print-note">
          <span class="glue">Click the sheet music to open a printable PDF,</span>
          <span class="glue"> and then press Ctrl+P to print</span>
        </div>
      </div>
      <h1 v-else class="track-title">{{trackTitle}}</h1>
    </section-->
  </main>
</template>

<script>
import Player from '~/components/Player.vue';

import { mapMutations } from 'vuex';

import axios from 'axios';

const imagesLoaded = !process.browser ? {} : require('vue-images-loaded');

export default {
  components: {
    Player,
  },

  directives: {
    imagesLoaded
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
        a11y: {
          prevSlideMessage:  'Previous sample',
          nextSlideMessage:  'Next sample',
          firstSlideMessage: 'This is the first sample',
          lastSlideMessage:  'This is the last sample',
        },
        pagination: {
          el: '.swiper-pagination',
          dynamicBullets: true,
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

    trackTitle() {
      return !this.p.current.track ? '' : `(${this.p.current.track}) ` + (this.p.current.title ? this.p.current.title : '[untitled]');
    },

    scoreClass() {
      return {
        'is-loaded': this.p.current.scoreIsLoaded,
        'is-printable': this.isPrintable,
      }
    },

    isPrintable() {
      return !!this.p.current.print;
    },

    scoreTip() {
      return this.isPrintable ? 'Click for printable PDF...' : '';
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
      this.set({isInit:true});
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    async initSamples() {
      const res = await axios.get(`${this.$store.state.urlBase}${this.$route.params.item}/?output=json`);
      if (!res.data.response.success) {
        return this.set({alert: res.data.response.message});
      }

      const samples = res.data.samples;

      this.set({
        title:   res.data.title,
        item:    this.$route.params.item,
        samples: samples,
        firstId: samples[0].id,
        lastId:  samples[samples.length - 1].id,
      });

      this.update();
    }, // initSamples()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      //console.log('update() route...', this.$route.hash);

      const id = (this.$route.hash.match(/[a-zA-Z0-9]+/) || [this.$store.state.firstId])[0];

      const index = this.$store.state.samples.findIndex(i => i.id === id);

      if (index === -1) {
        return this.$router.push('./'); // TODO: use .replace() instead?
      }

      this.set({currentIndex: index});

      if (this.swiper.activeIndex !== index) {
        this.swiper.slideTo(index);
      }

    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    toggleListShown(e) {

      if (e.target === window.$('.is-list-shown')[0]) {
        this.$store.commit('player/set', {isListShown: false});
      }

    }, // toggleListShown()

    //------------------------------------------------------------------------------------------------------------------

    imageProgress(instance, image) {
      this.$store.commit('player/setCurrent', {
        //loadingClass: '',
        scoreIsLoaded: image.isLoaded
      });
    }, // imageProgress()

    //------------------------------------------------------------------------------------------------------------------

    print() {
      window.location = this.p.current.print;
    }, // print()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================
};
</script>

<style lang="scss">
@function shortTransition() {
  @return all .2s ease;
}

$alert-color: #f00;
$background-color: hsl(0, 0%, 95%);
$theme-color: #c51;
$radius: .5em;

@mixin drop-shadow() {
  box-shadow: 0 0 1em transparentize(darken($background-color, 75%), .75);
}

html {
  font-size: 10px;
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

main::before {
  content: '';
  position: fixed;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  z-index: 9; /* below header, above swiper */
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
  z-index: 99; /* above all */
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
  z-index: 10; /* above swiper */
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow();
}

.item-title {
  font-size: 1.8em;
  margin: 0;
  padding: 0.5em;
  text-align: center;
  color: $theme-color;
}
.audio-player {
  border-radius: $radius;
}

.swiper-container {
  margin-top: 1.5em;
  width: 100%;
  margin-left: -4em;
  padding-left: 4em;
  margin-right: -4em;
  padding-right: 4em;
}
.swiper-container::before {
  content: '';
  background: linear-gradient(to right, $background-color, transparent 4em, transparent calc(100% - 4em), $background-color);
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
}

.swiper-slide {
  user-select: none;
  cursor: default;
  background-color: white;
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
  border: 1px solid hsl(0, 0%, 60%);
  box-sizing: border-box;
  min-height: 25vh;
}

.swiper-button {
  margin-top: 0;
  transform: translateY(-50%);
  height: 7em;
  width: 3.5em;
  background-color: hsla(0, 100%, 100%, .9);
  transition: shortTransition();
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

.copyright {
  position: absolute;
  z-index: 9;
  bottom: .5em;
  color: darken($alert-color, 25%);
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
  left: 50%;
  transform: translateX(-50%);
}



/* obsolete...*/

.info {
  margin-top: 1.5em; // [2018-03-28] Edge bug: 1em (10px) causes white line above while playing audio
  min-width: 600px;
  text-align: center;
  transition: all .25s ease-in-out;
}
.info.transition-left {
  transform: translateX(-50%);
}
.info.transition-right {
  transform: translateX(50%);
}

.score {
  position:relative;
  background-color: white;
  opacity: 0;
}
.score.is-loaded {
  opacity: 1;
}
.score.is-printable {
  cursor: pointer;
}

.score:not(.is-loaded) .print-note {
  display: none;
}

.score img {
  position: relative;
  margin: 25px 0;
  max-width: 100%;
}

.print-note {
  position:absolute;
  top:50px;
  padding:5px;
  font-size:16px;
  line-height:1.25em;
  border-radius:10px;
  color:gray;
  border:1px solid gray;
  box-shadow:0 0 5px #ccc;
  max-height:2.5em;
  width: 588px;
  max-width: calc(100% - 12px);
  overflow:hidden;
  background-color:white;
  opacity:1;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 1s;
}
.print-note.highlight {
  background-color:white;
  animation: highlight-fade 3s;
}

@keyframes highlight-fade {
  0%, 70% {
    background-color:yellow;
  }
  to {
    background-color:white;
  }
}

.score:hover .print-note {
  opacity:0;
  transition: opacity 1s;
}

</style>
