<template>
  <div>
    <article :class="sliderClass('dpi80')" :aria-grabbed="isGrabbing">
      <div class="frame js_frame">
        <div class="slides js_slides">
          <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                   :class="`slide js_slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 80)" @click="onclickSlide">
            <div class="slide-liner">
              <template v-if="sample.image">
                <img                  data-dpi="80"       :src="imgSrc(sample,  80)" @load="imgLoaded(sample.index,  80)" draggable="false" />
              </template>
              <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
            </div>
          </section>
        </div>
        <nuxt-link class="btn slider-button prev" :tabindex="s.dpi === 80 ? 0 : -1" :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
          <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
        </nuxt-link>
        <nuxt-link class="btn slider-button next" :tabindex="s.dpi === 80 ? 0 : -1" :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
          <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
        </nuxt-link>
      </div>
    </article>

    <article v-if="s.hasZoom" :class="sliderClass('dpi120')" :aria-grabbed="isGrabbing">
      <div class="frame js_frame">
        <div class="slides js_slides">
          <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                   :class="`slide js_slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 120)" @click="onclickSlide">
            <div class="slide-liner">
              <template v-if="sample.image">
                <img data-dpi="120" :src="imgSrc(sample, 120)" @load="imgLoaded(sample.index, 120)" draggable="false" />
              </template>
              <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
            </div>
          </section>
        </div>
        <nuxt-link class="btn slider-button prev" :tabindex="s.dpi === 120 ? 0 : -1" :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
          <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
        </nuxt-link>
        <nuxt-link class="btn slider-button next" :tabindex="s.dpi === 120 ? 0 : -1" :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
          <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
        </nuxt-link>
      </div>
    </article>
  </div>
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
      sliderZoom: null,

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
      'getSample',
      'listItemClass',
    ]),

    s() {
      return this.$store.state;
    },
  },

  watch: {
    samples: 'init',
    currentIndex: 'update',
  },

  beforeDestroy () {
    if (this.slider)     this.slider.destroy();
    if (this.sliderZoom) this.sliderZoom.destroy();
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.$nextTick(() => {
        this.$el.addEventListener('after.lory.init',    this.onInit);
        this.$el.addEventListener('on.lory.touchstart', () => this.isGrabbing = true);
        this.$el.addEventListener('on.lory.touchend',   () => this.isGrabbing = false);
        this.$el.addEventListener('after.lory.slide',   this.onSlideChange);

        window._resizeT = null;
        window.addEventListener('resize', () => {
          // this is needed to ensure that font-size = 0 when lory resize calculations occur
          window.$('.slider').addClass('is-resizing');
          clearTimeout(window._resizeT);

          window._resizeT = setTimeout(() => {
            window.$('.slider').removeClass('is-resizing');
          }, settings.TRANSITION_TIME_MS);

          if (document.documentElement.clientWidth !== this.viewWidth) this.update();
          this.autosize();
        });

        if (!this.slider && this.samples.length) {
          //this.slider = lory(this.$el, Object.assign(this.defaultOptions, this.options));
          this.slider = lory(document.getElementsByClassName('dpi80')[0],  Object.assign(this.defaultOptions, this.options));
          if (this.s.hasZoom) this.sliderZoom = lory(document.getElementsByClassName('dpi120')[0], Object.assign(this.defaultOptions, this.options));
        }
      });
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    sliderClass(dpiClass) {
      return `${dpiClass} slider js_slider ${this.isInit ? 'is-init' : ''}`;
    }, // sliderClass()

    //------------------------------------------------------------------------------------------------------------------

    onInit() {
      setTimeout(() => {
        this.isInit = true;
        this.update();
      }, settings.TRANSITION_TIME_MS);
    }, // onInit()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      this.$nextTick(() => {
        if (this.slider)     this.slider.slideTo(this.currentIndex);
        if (this.sliderZoom) this.sliderZoom.slideTo(this.currentIndex);

        this.viewWidth = document.documentElement.clientWidth;
      });
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    onSlideChange(/*e*/) {
      console.log('onSlideChange()');
      // update route only when initiated "internally"
      const index = this.slider.returnIndex();
      if (this.isGrabbing) {
        window.$nuxt.$router.replace(`#${window.$nuxt.$store.state.samples[index].id}`);
      }

      this.autosize();
    }, // onSlideChange()

    //------------------------------------------------------------------------------------------------------------------

    autosize(dpi = 80) {
      const index = this.s.currentIndex;

      const $slider = window.$(`.slider.dpi${dpi}`);

      const $frame  = $slider.find('.frame');
      const $slides = $slider.find('.slides');
      const $slide  = $slider.find(`.slide[data-index="${index}"]`);

      const h = Math.ceil($slide.height());
      const w = Math.ceil($slide.width());

      const margin = -Math.floor(($slides.height() - h) / 2);

      // autosize
      $frame.css({
        height: `${h}px`,
        width:  `${w}px`,
      }).toggleClass('show-pagefades', w + 20 /* margin gaps */ < this.viewWidth);

      $slides.css({
        marginTop: `${margin}px`,
      });

      if (dpi === 80 && this.s.hasZoom) this.autosize(120);
    }, // autosize()

    //------------------------------------------------------------------------------------------------------------------

    sampleStyleSize(sample, dpi = 80) {
      const xdpi = sample.image ? dpi : 1;
      let   w    = sample.image ? Math.ceil(sample.image.w * xdpi) : null;
      let   h    = sample.image ? Math.ceil(sample.image.h * xdpi) : null;
      if (w > this.viewWidth) {
        const hRatio = h / w;
        w = this.viewWidth;
        h = w * hRatio;
      }
      const width    = sample.image ? `${w}px` : '100vmin';
      const height   = sample.image ? `${h}px` : '';
      const maxWidth = sample.image ? '' : '650px'; // sheet music width

      return {width, height, maxWidth};
    }, // sampleStyleSize()

    //------------------------------------------------------------------------------------------------------------------

    imgSrc(sample, dpi) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}(${dpi}).${sample.image.ext}`;
    }, // imgSrc()

    //------------------------------------------------------------------------------------------------------------------

    imgLoaded(i, dpi) {
      console.log('imgLoaded', i, dpi);
      // TODO: multiple size images; lazy loading; fadein when first image has loaded
    }, // imgLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onclickSlide(e) {
      if (!window.$('main.has-mouse').length || !this.s.hasZoom) return;

      const asDec = (x) => e[`offset${x}`] / e.target.getBoundingClientRect()[(x === 'X' ? 'width' : 'height')];

      this.toggleDpi({
        elX: asDec('X'),
        elY: asDec('Y'),
      });
    }, // onclickSlide()

    //------------------------------------------------------------------------------------------------------------------

    async toggleDpi({elY = 0.5} = {}) {

      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const dpi = (this.s.dpi === 80 ? 120 : 80);
      this.$store.commit('set', {dpi});

      const zoomIn = (dpi === 120);

      const $main       = window.$('main');
      const $slider     = window.$(`.slider.dpi80`);
      const $sliderZoom = window.$(`.slider.dpi120`);
      const $frame      = $slider.find('.frame');
      const $frameZoom  = $sliderZoom.find('.frame');

      // ensure no transitions are in effect to delay prep layout
      $main.addClass('no-transition');

      const index = this.s.currentIndex;
      const h = this.s.samples[index].image.h;

      const yScroll = window.scrollY;

      if (zoomIn) {
        const yDiff = Math.round((h * elY * (120 - 80)) - $frame.offset().top);

        const yScrollTo = yScroll + yDiff;

        // position the zoom slider to trigger layout
        $sliderZoom.css({position: 'absolute'});

        // position view to compensate for new layout
        window.scroll(0, yScrollTo);

        // when non-zoom frame is contained within view, desired scroll position may not be possible
        const yScrollAdj = window.scrollY - yScrollTo;
        const yFrame = Math.max(yDiff, 0) + Math.min(yScrollAdj, 0);

        // adjust non-zoom frame to original screen position
        $frame.css({transform: `translate(0, ${yFrame}px)`});

        const yOrigin = ($frame.offset().top - $frameZoom.offset().top) / ($frameZoom.height() - $frame.height());

        $slider.css({'z-index': 1});
        $sliderZoom.css({opacity: 0});
        $frame.css({'transform-origin': `center ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $main.removeClass('no-transition');
        $frame.addClass('is-zooming').css({transform: `translate(0, ${yFrame}px) scale(${120 / 80})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $slider.css({'z-index': ''});
        $sliderZoom.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        $main.addClass('no-transition');
        $slider.css({opacity: 0, 'pointer-events': 'none'});
        $frame.removeClass('is-zooming').css({transform: ''});

        this.forceRepaint();
        $main.removeClass('no-transition');

      // zoom out
      } else {
        const yTop = $frame.offset().top;

        const yDiff = Math.round((h * elY * (120 - 80)) - (yTop - $frameZoom.offset().top));

        const yMargin = document.documentElement.clientHeight - $frame.height();

        const yMarginTop = yTop + yDiff - yScroll;

        const yMarginBottom = yScroll + document.documentElement.clientHeight - (yTop + yDiff + $frame.height());

        const yScrollAdj = (yMargin > 0
          ? yScroll - (yTop + yDiff) + Math.max(yMargin / 2, 0)
          : Math.min(-yMarginTop, 0) + Math.max(yMarginBottom, 0) );

        // position non-zoom frame in the desired relative location
        const yFrame = yDiff + yScrollAdj;
        $frame.css({transform: `translate(0, ${yFrame}px)`});

        const yOrigin = ($frame.offset().top - $frameZoom.offset().top) / ($frameZoom.height() - $frame.height());

        $sliderZoom.css({'z-index': 1});
        $slider.css({opacity: 0});
        $frameZoom.css({'transform-origin': `center ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $main.removeClass('no-transition');
        $frameZoom.addClass('is-zooming').css({transform: `scale(${80 / 120})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $sliderZoom.css({'z-index': ''});
        $slider.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const yScrollTo = Math.max(window.scrollY - $frame.offset().top, 0);

        $main.addClass('no-transition');
        $sliderZoom.css({opacity: 0, 'pointer-events': 'none'});
        $frameZoom.removeClass('is-zooming').css({transform: ''});
        $frame.css({transform: ''});
        $sliderZoom.css({position: 'fixed'});
        window.scroll(0, yScrollTo);

        this.forceRepaint();
        $main.removeClass('no-transition');
      } // zoom out

    }, // toggleDpi()

    //------------------------------------------------------------------------------------------------------------------
    // see <https://gist.github.com/paulirish/5d52fb081b3570c81e3a>

    forceRepaint($el = null) {
      ($el || window.$('body')).offset();
    }, // forceRepaint()

    //------------------------------------------------------------------------------------------------------------------
    // adapted from <https://stackoverflow.com/questions/7982053/get-translate3d-values-of-a-div>

    getTranslate($el) {
      const m = $el.css('-webkit-transform').match(/matrix(?:(3d)\(-{0,1}\d+\.?\d*(?:, -{0,1}\d+\.?\d*)*(?:, (-{0,1}\d+\.?\d*))(?:, (-{0,1}\d+\.?\d*))(?:, (-{0,1}\d+\.?\d*)), -{0,1}\d+\.?\d*\)|\(-{0,1}\d+\.?\d*(?:, -{0,1}\d+\.?\d*)*(?:, (-{0,1}\d+\.?\d*))(?:, (-{0,1}\d+\.?\d*))\))/);
      if (!m) return {x:0, y:0, z:0};
      if (m[1] === '3d') return {x:+m[2], y:+m[3], z:+m[4]};
      return {x:+m[5], y:+m[6], z:0};
    }, // getTranslate()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$frame-unit: $unit;// ($unit / 1em) * 10px;
$zoomRatio: 120 / 80;

$layer-pagefades: 2; // raise above prev/next slides
$layer-hover: $layer-pagefades + 1;
$layer-buttons: $layer-hover + 1;

.slider {
  position: absolute;
  width: 100%;
  opacity: 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  @include short-transition;

  @at-root .no-transition & {
    transition: none;
  }

  &.is-init {
    opacity: 1;
  }

  &.dpi120 {
    position: fixed;
    pointer-events: none;
    opacity: 0;
  }

  .frame {
    width: 100px; // must have a default px width
    height: 100px;

    position: relative;
    overflow: hidden;
    white-space: nowrap;

    line-height: 0;
    font-size: 0; // lory setup has errors if font size is not 0
    @include short-transition;

    @at-root .is-init#{&} {
      font-size: inherit;
    }
    @at-root .is-resizing#{&} {
      font-size: 0;
      transition: none;
    }
    @at-root .no-transition & {
      transition: none;
    }

    cursor: grab;
    @at-root [aria-grabbed]#{&} {
      cursor: grabbing;
    }

    // [2018-06-12] hack to fix sizing bug
    html[data-browser*="Firefox"] & {
      padding-bottom: 1px;
    }

    &.show-pagefades {
      margin-left:  -$frame-unit;
      padding-left:  $frame-unit;
      margin-right: -$frame-unit;
      padding-right: $frame-unit;

      @at-root .dpi120#{&} {
        margin-left:  -$frame-unit * $zoomRatio;
        padding-left:  $frame-unit * $zoomRatio;
        margin-right: -$frame-unit * $zoomRatio;
        padding-right: $frame-unit * $zoomRatio;
      }

      @at-root .slider:not(.is-resizing) .show-pagefades::before { // mask for prev/next slide fades
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: $layer-pagefades;
        pointer-events: none;
        background: linear-gradient(to right, $background-color, transparent $frame-unit, transparent calc(100% - #{$frame-unit}), $background-color);
        // [2018-05-29] IE11 and Edge cannot handle calc()
        html[data-browser*="Trident"] &,
        html[data-browser*="Edge"] & {
          background: linear-gradient(to right, $background-color, transparent 5%, transparent 95%, $background-color);
        }
      }
    } // margin fades
  } // .frame

  .slides {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
    line-height: 1;
    // [2018-06-21] IE11 still has about 5% usage
    html[data-browser*="Trident"] & {
      display: inline-block;
    }
  }

  .slide {
    position: relative;
    display: inline-block;
    vertical-align: text-top;
    text-align: center;
    background-color: white;
    margin-right: ($unit * 1/4);
    @at-root .dpi120#{&} {
      margin-right: ($unit * 1/4 * $zoomRatio);
    }
    @include short-transition;

    @at-root .has-mouse.has-zoom[data-dpi="80"] .slide {
      cursor: zoom-in;
    }
    @at-root .has-mouse.has-zoom[data-dpi="120"] .slide {
      cursor: zoom-out;
    }

    // TODO
    @include below-sheet-music-min {
      height: 100vmin;
    }

    &::before {
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
      height: 100%;
      overflow: hidden;

      &::after {
        position: absolute;
        content: 'COPYRIGHTED MATERIAL';
        white-space: nowrap;
        bottom: .5em;
        color: darken($alert-color, 25%);
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
        @include absolute-center(x);

        @at-root .dpi120#{&} {
          font-size: 1.5em;
        }
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
    width: 3em;
    height: 6em;
    fill: currentColor;
    @include absolute-center();
  }

  .show-pagefades .slider-button {
    position: absolute;
    z-index: $layer-buttons;
    top: 50%;
    margin-top: 0;
    transform: translateY(-50%);
    height: 8em;
    width: 4em;
    background: no-repeat center white;
    cursor: pointer;
    outline: none;
    @include short-transition;

    @at-root .dpi80 .is-zooming .slider-button {
      transform: translateY(-50%) scale(1 / $zoomRatio);
    }
    @at-root .dpi120 .is-zooming .slider-button {
      transform: translateY(-50%) scale($zoomRatio);
    }

    &[disabled] {
      pointer-events: none;
      opacity: 0 !important;
    }

    &.prev {
      left: 0;
      @at-root .dpi120#{&} {
        left: 2em;
      }
      border-radius: 1em 0 0 1em;
      transform-origin: right;
    }
    &.next {
      right: 0;
      @at-root .dpi120#{&} {
        right: 2em;
      }
      border-radius: 0 1em 1em 0;
      transform-origin: left;
    }
  } // .slider-button
} // .slider

</style>
