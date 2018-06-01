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
    }
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

    onSlideChange(e) {
      console.log('slide to', this.slider.returnIndex(), 'grabbing?', this.isGrabbing, e); // TODO
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
    padding: 0;
    width: 100%;
    display: flex;
    align-items: start;
    font-size: 1rem;
    line-height: 1;
  }

  .slide {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: start;
    background-color: white;
    min-height: 50vh;
    margin-right: ($unit * 1.5/4);
    cursor: grab;

    .grabbing & {
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

    .slide-liner::after {
      position: absolute;
      content: 'COPYRIGHTED MATERIAL';
      white-space: nowrap;
      bottom: .5em;
      color: darken($alert-color, 25%);
      text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
      @include absolute-center(x);
    }

    img {
      vertical-align: top;
      object-position: top;
    }
  } // .slide
} // .slider
</style>
