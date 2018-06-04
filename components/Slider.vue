<template>
  <article :class="sliderClass">
    <div class="frame js_frame">
      <div class="slides js_slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index" class="slide js_slide">
          <div class="slide-liner">
            <img v-if="sample.image" :src="imgSrc(sample)" :style="`height:${sample.image.h}px; width:${sample.image.w}px`" draggable="false" />
            <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
          </div>
        </section>
      </div>
      <nuxt-link class="btn slider-button prev" tabindex="0" :to="'#' + getSample(-1, 'id')" :disabled="!getSample(-1)" aria-label="Previous sample" replace tag="button"></nuxt-link>
      <nuxt-link class="btn slider-button next" tabindex="0" :to="'#' + getSample(+1, 'id')" :disabled="!getSample(+1)" aria-label="Next sample" replace tag="button"></nuxt-link>
    </div>
  </article>
</template>

<script>

import { lory } from 'lory.js';

import settings from '~/assets/settings';

export default {

  props: {
    options: Object,
    samples: Array,
    currentIndex: Number,
  },

  data () {
    return {
      slider: null,

      defaultOptions: {
        slideSpeed: settings.TRANSITION_TIME_MS,
        ease: 'ease-in-out',
      },

      isInit: false,
      isGrabbing: false,
    }
  },

  computed: {
    s() {
      return this.$store.state;
    },

    sliderClass() {
      return {
        'slider': true,
        'js_slider': true,
        'is-init': this.isInit,
        'grabbing': this.isGrabbing,
      }
    },
  },

  watch: {
    samples: 'init',
    currentIndex: 'update',
  },

  mounted () {
  },

  beforeDestroy () {
    this.slider.destroy()
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.$nextTick(() => {
        this.$el.addEventListener('on.lory.touchstart', () => this.isGrabbing = true);
        this.$el.addEventListener('on.lory.touchend',   () => this.isGrabbing = false);
        this.$el.addEventListener('after.lory.slide', this.onSlideChange);

        if (!this.slider && this.samples.length) this.slider = lory(this.$el, Object.assign(this.defaultOptions, this.options));

        setTimeout(() => {
          this.isInit = true;
        }, settings.TRANSITION_TIME_MS);
      });
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      this.$nextTick(() => {
        if (this.slider) this.slider.slideTo(this.currentIndex);
      });
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    getSample(dir = 0, key, currentIndex = null) {
      const i = (currentIndex === null ? this.s.currentIndex : currentIndex) + dir;
      const sample = (this.s.samples[i] ? this.s.samples[i] : null);
      return sample && key ? sample[key] : sample;
    }, // getSample()

    //------------------------------------------------------------------------------------------------------------------

    onSlideChange(/*e*/) {
      // update route only when initiated "internally"
      const index = this.slider.returnIndex();
      if (this.isGrabbing) {
        window.$nuxt.$router.replace(`#${window.$nuxt.$store.state.samples[index].id}`);
      }
      window.$('.slider .frame').css({height: window.$(`.slide[data-index="${index}"]`).height() + 'px'});
    }, // onSlideChange()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}.${sample.image.ext}`;
    }, // imgSrc()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$frame-unit: $unit;// ($unit / 1em) * 10px;

.slider {
  margin-top: $unit/4;

  .frame {
    width: 100%;
    margin-left: -$frame-unit;
    padding-left: $frame-unit;
    margin-right: -$frame-unit;
    padding-right: $frame-unit;

    position: relative;
    overflow: hidden;
    white-space: nowrap;
    @include short-transition;

    font-size: 0;
    line-height: 0;
    // lory setup has errors if font size is not 0
    @at-root .slider.is-init .frame {
      font-size: inherit;
      line-height: inherit;
    }

    &::before { // mask for prev/next slide fades
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      z-index: 2; // raise above prev/next slides
      pointer-events: none;
      background: linear-gradient(to right, $background-color, transparent $frame-unit, transparent calc(100% - #{$frame-unit}), $background-color);
      // [2018-05-29] IE11 and Edge cannot handle calc()
      html[data-browser*="Trident"] &,
      html[data-browser*="Edge"] & {
        background: linear-gradient(to right, $background-color, transparent 5.5%, transparent 94.5%, $background-color);
      }
    }
  } // .frame

  .slides {
    box-sizing: border-box;
    display: inline-block;
    font-size: 1rem;
    line-height: 1;
  }

  .slide {
    position: relative;
    display: inline-block;
    vertical-align: text-top;
    text-align: center;
    background-color: white;
    margin-right: ($unit * 1.5/4);
    cursor: grab;

    @at-root .grabbing .slide {
      cursor: grabbing;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      border: 1px solid hsl(0, 0%, 60%);
    }

    .slide-liner {
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      width: 650px;
      min-height: 50vh;

      &::after {
        position: absolute;
        content: 'COPYRIGHTED MATERIAL';
        white-space: nowrap;
        bottom: .5em;
        color: darken($alert-color, 25%);
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
        @include absolute-center(x);
      }
    }

    img {
      vertical-align: top;
      object-position: top;
    }

    .sample-title {
      font-size: 2.5em;
      margin: 2rem 0; // only has effect in IE, where flexbox positioning does not apply

      &::after {
        content: '';
        display: block;
        width: 100%;
        margin-top: 5vh;
        height: 20vh;
        // audio icon sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M0,6 v6 h4 l5,5 v-16 l-5,5 h-4 z' /%3E%3Cpath d='M13.5,9 c0,-1.8 -1,-3.3 -2.5,-4 v8 c1.5,-0.7 2.5,-2.2 2.5,-4 z' /%3E%3Cpath d='M11,.2 v2 c3,1 5,3.6 5,6.8 s-2,5.8 -5,6.7 v2 c4,-0.8 7,-4.4 7,-8.7 s-3,-8 -7,-8.8 z' /%3E%3C/svg%3E") no-repeat center;
        opacity: .05;
      }
    }

  } // .slide

  .slider-button {
    position: absolute;
    z-index: 3; // raise above mask
    top: 50%;
    margin-top: 0;
    transform: translateY(-50%);
    height: 7em;
    width: 3.5em;
    background: no-repeat center white;
    background-size: 27px 44px; // copied from swiper.js
    cursor: pointer;
    outline: none;
    @include short-transition;

    &[disabled] {
      cursor: default;
      opacity: .1 !important;
    }

    &.prev {
      left: .5em;
      border-radius: 1em 0 0 1em;
      // copied from swiper.js
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2027%2044'%3E%3Cpath%20d%3D'M0%2C22L22%2C0l2.1%2C2.1L4.2%2C22l19.9%2C19.9L22%2C44L0%2C22L0%2C22L0%2C22z'%20fill%3D'%23007aff'%2F%3E%3C%2Fsvg%3E");
    }
    &.next {
      right: .5em;
      border-radius: 0 1em 1em 0;
      // copied from swiper.js
      background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%2027%2044'%3E%3Cpath%20d%3D'M27%2C22L27%2C22L5%2C44l-2.1-2.1L22.8%2C22L2.9%2C2.1L5%2C0L27%2C22L27%2C22z'%20fill%3D'%23007aff'%2F%3E%3C%2Fsvg%3E");
    }
  }
} // .slider

</style>
