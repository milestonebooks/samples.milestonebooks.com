<template>
  <article :class="sliderClass" :aria-grabbed="isGrabbing">
    <div class="frame js_frame">
      <div class="slides js_slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index" class="slide js_slide">
          <div class="slide-liner">
            <img v-if="sample.image" :src="imgSrc(sample)" :style="`/*height:${sample.image.h}px; width:${sample.image.w}px*/`" @load="imgLoaded(sample.index)" draggable="false" />
            <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
          </div>
        </section>
      </div>
      <nuxt-link class="btn slider-button prev" tabindex="0" @click.native.stop :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
        <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
      </nuxt-link>
      <nuxt-link class="btn slider-button next" tabindex="0" @click.native.stop :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
        <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
      </nuxt-link>
    </div>
  </article>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import { lory } from 'lory.js';

import settings from '~/assets/settings';

import { mapGetters } from 'vuex';

export default {
  components: {
    SvgIcon,
  },

  props: {
    options: Object,
    samples: Array,
    currentIndex: Number,
  },

  data () {
    return {
      slider: null,

      defaultOptions: {
        rewindOnResize: false,
        slideSpeed: settings.TRANSITION_TIME_MS,
        ease: 'ease-in-out',
      },

      isInit: false,
      isGrabbing: false,
      viewWidth: null,
    }
  },

  computed: {
    ...mapGetters([
      'getSample'
    ]),

    s() {
      return this.$store.state;
    },

    sliderClass() {
      return {
        'slider': true,
        'js_slider': true,
        'is-init': this.isInit,
      }
    },
  },

  watch: {
    samples: 'init',
    currentIndex: 'update',
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
        window.addEventListener('resize', () => {
          if (document.documentElement.clientWidth !== this.viewWidth) this.update();
        });

        if (!this.slider && this.samples.length) this.slider = lory(this.$el, Object.assign(this.defaultOptions, this.options));

        setTimeout(() => {
          this.isInit = true;
          this.update();
        }, settings.TRANSITION_TIME_MS);
      });
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      this.$nextTick(() => {
        if (this.slider) this.slider.slideTo(this.currentIndex);
        this.viewWidth = document.documentElement.clientWidth;
      });
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    onSlideChange(/*e*/) {
      // update route only when initiated "internally"
      const index = this.slider.returnIndex();
      if (this.isGrabbing) {
        window.$nuxt.$router.replace(`#${window.$nuxt.$store.state.samples[index].id}`);
      }
      const $slide = window.$(`.slide[data-index="${index}"]`);
      window.$('.slider .frame').css({
        height: $slide.height() + 'px',
        width:  $slide.width()  + 'px',
      });
    }, // onSlideChange()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample) {
      const dpi = sample.image.dpi[0] ? `(${sample.image.dpi[0]})` : '';
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}${dpi}.${sample.image.ext}`;
    }, // imgSrc()

    //------------------------------------------------------------------------------------------------------------------
    // makes sure slider is sized correctly after image dimensions
    // TODO: encoding dimensions on <img> tag will probably make this unnecessary

    imgLoaded(i) {
      if (i === this.currentIndex) this.update();
    }, // imgLoaded()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$frame-unit: $unit;// ($unit / 1em) * 10px;

$sheet-music-width: 650px;

@mixin below-sheet-music-min() {
  @media (max-width: #{$sheet-music-width - 1px}) {
    @content;
  }
}

@mixin sheet-music-min {
  @media (min-width: #{$sheet-music-width}) {
    @content;
  }
}

.slider {
  //*
  margin-top: $unit/4;
  /*/
  overflow-y: scroll; // always on to avoid possible jank when toggling playlist
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  //*/

  .frame {
    width: 100%;

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

    @include sheet-music-min {
      margin-left: -$frame-unit;
      padding-left: $frame-unit;
      margin-right: -$frame-unit;
      padding-right: $frame-unit;

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
    } // margin fades
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

    @at-root [aria-grabbed]#{&} {
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
      width: 100vw;
      min-height: 50vh;
      overflow: hidden;

      @include sheet-music-min {
        width: auto;
        min-width: $sheet-music-width;
      }

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
      max-width: 100%;
      vertical-align: top;
      object-position: top;
    }

    .sample-title {
      font-size: 2.5em;
      margin: 2rem;
      white-space: normal;

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

  .btn:not(:disabled):focus,
  .btn:not(:disabled):hover {
    color: $focus-color;
  }

  .btn svg {
    width: 2.4em;
    height: 4.8em;
    fill: currentColor;
    @include absolute-center();

    @include sheet-music-min {
      width: 3em;
      height: 6em;
    }
  }

  .slider-button {
    position: absolute;
    z-index: 3; // raise above mask
    top: 50%;
    margin-top: 0;
    transform: translateY(-50%);
    height: 6em;
    width: 3em;
    background: no-repeat center white;
    cursor: pointer;
    outline: none;
    @include short-transition;

    @include below-sheet-music-min {
      position: fixed;
      box-shadow: $list-shadow;
    }

    @include sheet-music-min {
      width: 4em;
      height: 8em;
    }

    &[disabled] {
      pointer-events: none;
      opacity: 0 !important;
    }

    &.prev {
      left: 0;
      border-radius: 0 1em 1em 0;

      @include below-sheet-music-min {
        padding-right: 1em;
        transition: all .2s ease-in-out, transform 1s ease-in-out;
        @at-root main:not(.options-mode) & {
          transform: translate(-110%, -50%);
        }
      }
      @include sheet-music-min {
        left: 0;
        border-radius: 1em 0 0 1em;
      }
    }
    &.next {
      right: 0;
      border-radius: 1em 0 0 1em;

      @include below-sheet-music-min {
        padding-left: 1em;
        transition: all .2s ease-in-out, transform 1s ease-in-out;
        @at-root main:not(.options-mode) & {
          transform: translate(110%, -50%);
        }
      }

      @include sheet-music-min {
        right: 0;
        border-radius: 0 1em 1em 0;
      }
    }
  }
} // .slider

</style>
