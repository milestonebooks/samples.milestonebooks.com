<template>
  <div :class="containerClass" :aria-grabbed="isGrabbing">

    <article :class="sliderClass(80)" data-dpi="80">
      <div class="frame js_frame">
        <div class="slides js_slides">
          <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                   :class="`slide js_slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 80)" @click="onclickSlide">
            <div class="slide-liner">
              <img v-if="sample.image" :src="imgSrc(sample, 80)" @load="imgLoaded(sample.index, 80)" draggable="false" />
              <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
            </div>
          </section>
        </div>
        <!--nuxt-link class="btn slider-button prev" :tabindex="s.dpi === 80 ? 0 : -1" :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
          <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
        </nuxt-link>
        <nuxt-link class="btn slider-button next" :tabindex="s.dpi === 80 ? 0 : -1" :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
          <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
        </nuxt-link-->
      </div>
    </article>

    <article v-if="s.hasZoom" :class="sliderClass(120)" data-dpi="120">
      <div class="frame js_frame">
        <div class="slides js_slides">
          <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                   :class="`slide js_slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 120)" @click="onclickSlide">
            <div class="slide-liner">
              <img :src="imgSrc(sample, 120)" @load="imgLoaded(sample.index, 120)" draggable="false" />
            </div>
          </section>
        </div>
        <!--nuxt-link class="btn slider-button prev" :tabindex="s.dpi === 120 ? 0 : -1" :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
          <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
        </nuxt-link>
        <nuxt-link class="btn slider-button next" :tabindex="s.dpi === 120 ? 0 : -1" :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
          <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
        </nuxt-link-->
      </div>
    </article>

    <nuxt-link class="btn slider-button prev" :tabindex="0" :to="'#' + getSample(-1, 'id')" replace :disabled="!getSample(-1)" aria-label="Previous sample" tag="button">
      <SvgIcon view="24 48" d="M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z"></SvgIcon>
    </nuxt-link>
    <nuxt-link class="btn slider-button next" :tabindex="0" :to="'#' + getSample(+1, 'id')" replace :disabled="!getSample(+1)" aria-label="Next sample" tag="button">
      <SvgIcon view="24 48" d="M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z"></SvgIcon>
    </nuxt-link>

  </div>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import { lory } from 'lory.js';

import settings from '~/assets/settings';

import { mapGetters } from 'vuex';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

      isInit80:     false,
      isInit120:    false,
      isGrabbing:   false,
      isResizing:   false,
      noTransition: true,
      viewWidth:    document.documentElement.clientWidth,
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

    isInit() {
      return this.isInit80 && (this.s.hasZoom ? this.isInit120 : true);
    },

    containerClass() {
      return {
        'slider-container': true,
        'is-init':          this.isInit,
        'is-resizing':      this.isResizing,
        'no-transition':    this.noTransition,
      }
    }
  },

  watch: {
    samples: 'init',
    currentIndex: 'update',
    isInit() {
      // ensure that transitions are only enabled after init is complete
      this.$nextTick(() => {
        if (this.isInit) this.noTransition = false;
      });
    },
  },

  beforeDestroy () {
    if (this.slider)     this.slider.destroy();
    if (this.sliderZoom) this.sliderZoom.destroy();
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    init() {
      console.log('init', this.s.samples.length);

      this.$nextTick(() => {
        this.$el.addEventListener('after.lory.init',    this.onLoryInit);
        this.$el.addEventListener('on.lory.touchstart', () => this.isGrabbing = true);
        this.$el.addEventListener('on.lory.touchend',   () => this.isGrabbing = false);
        this.$el.addEventListener('after.lory.slide',   this.onSlideChange);

        window._resizeT = null;
        window.addEventListener('resize', () => {
          // this is needed to ensure that font-size = 0 when lory resize calculations occur
          this.isResizing = true;
          clearTimeout(window._resizeT);

          this.viewWidth = document.documentElement.clientWidth;

          window._resizeT = setTimeout(async () => {
            this.autosize();
            this.isResizing = false;
            this.update();
          }, settings.TRANSITION_TIME_MS);
        });

        if (!this.slider && this.samples.length) {
          this.slider = lory(document.getElementsByClassName('dpi80')[0],  Object.assign(this.defaultOptions, this.options));
          if (this.s.hasZoom) this.sliderZoom = lory(document.getElementsByClassName('dpi120')[0], Object.assign(this.defaultOptions, this.options));
        }
      });
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    sliderClass(dpi) {
      return `dpi${dpi} slider js_slider`;
    }, // sliderClass()

    //------------------------------------------------------------------------------------------------------------------

    onLoryInit(e) {
      const dpi = window.$(e.target).attr('data-dpi');
      this[`isInit${dpi}`] = true;

      this.update();
    }, // onLoryInit()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      if (!this.isInit) return;

      this.$nextTick(() => {
        console.log(`update: ${this.currentIndex} w:${document.documentElement.clientWidth - this.viewWidth}`);
        if (this.slider)     this.slider.slideTo(this.currentIndex);
        if (this.sliderZoom) this.sliderZoom.slideTo(this.currentIndex);
      });
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    onSlideChange(/*e*/) {
      // update route only when initiated "internally"
      const index = this.slider.returnIndex();
      console.log(`onSlideChange(${index})`);
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

      const h = Math.ceil($slide.height() / 2) * 2; // ensure even number to handle margin rounding
      const w = Math.ceil($slide.width());

      const margin = -Math.floor(($slides.height() - h) / 2);

      console.log(`autosize(${dpi}) h:${h} w:${w} ${this.viewWidth - document.documentElement.clientWidth} margin:${margin}`);

      // autosize
      $slider.css({
        'min-height': `${document.documentElement.clientHeight}px`
      });

      $frame.css({
        height: `${h}px`,
        width:  `${w}px`,
      }).toggleClass('show-pagefades', w + (settings.PAGEFADE_WIDTH * 2 * (dpi / 80)) /* TODO: margin gaps */ < this.viewWidth);

      $slides.css({
        marginTop: `${margin}px`,
      });

      if (dpi === 80 && this.s.hasZoom) this.autosize(120);
    }, // autosize()

    //------------------------------------------------------------------------------------------------------------------

    sampleStyleSize(sample, dpi = 80) {
      const xdpi = sample.image ? dpi : 1;
      let   w    = sample.image ? Math.ceil(sample.image.w * xdpi) : Math.min(this.viewWidth, document.documentElement.clientHeight);
      let   h    = sample.image ? Math.ceil(sample.image.h * xdpi) : null;

      if (sample.audio) h += 40; // add some vertical padding so sheet music won't be obscured by controls

      // mouse interactions can scroll; non-mouse is presumed to be a touch device, which can use native pinch-zoom and pan
      /* TODO: recalculates on first hover, which can cause shifting
      if (w > this.viewWidth && !this.s.hasMouse) {
        const hRatio = h / w;
        w = this.viewWidth;
        h = Math.floor(w * hRatio);
      }
      //*/

      const width    = `${w}px`;
      const height   = sample.image ? `${h}px` : '';
      const maxWidth = sample.image ? '' : '650px'; // sheet music width

      console.log(`sampleStyleSize(): viewWidth:${this.viewWidth}`); // w:${width} h:${height}`);

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
      const index = Number(e.target.getAttribute('data-index'));

      if (index !== this.s.currentIndex) {
        return this.$router.replace(`#${this.s.samples[index].id}`);
      }

      // abort zoom if not available or no mouse detected
      if (!this.s.hasZoom || !window.$('main.has-mouse').length) return;

      const asDec = (x) => e[`offset${x}`] / e.target.getBoundingClientRect()[(x === 'X' ? 'width' : 'height')];

      this.toggleDpi({
        elX: asDec('X'),
        elY: asDec('Y'),
      });
    }, // onclickSlide()

    //------------------------------------------------------------------------------------------------------------------

    async toggleDpi({elX = 0.5, elY = 0.5} = {}) {

      // TODO: cancel zoom action
      if (this.s.isZooming) return;

      this.$store.commit('set', {isZooming:true});

      const dpi = (this.s.dpi === 80 ? 120 : 80);
      this.$store.commit('set', {dpi});

      const zoomIn = (dpi === 120);

      // zoom slider may not have been initialized to correct zoom where a mouse interaction is available
      //TODO: if (zoomIn) this.autosize(120);

      const $el         = window.$('.slider-container');
      const $slider     = window.$(`.slider.dpi80`);
      const $sliderZoom = window.$(`.slider.dpi120`);
      const $frame      = $slider.find('.frame');
      const $frameZoom  = $sliderZoom.find('.frame');

      // ensure no transitions are in effect to delay prep layout
      $el.addClass('no-transition');

      const index = this.s.currentIndex;
      const w = this.s.samples[index].image.w;
      const h = this.s.samples[index].image.h;

      const xScroll = window.scrollX;
      const yScroll = window.scrollY;

      const xCompPagefades = $frame.hasClass('show-pagefades') && !$frameZoom.hasClass('show-pagefades');

      if (zoomIn) {
        const xDiff = Math.round((w * elX * (120 - 80)) - $frame.offset().left) - (xCompPagefades ? settings.PAGEFADE_WIDTH : 0);
        const yDiff = Math.round((h * elY * (120 - 80)) - $frame.offset().top);

        const xScrollTo = xScroll + xDiff;
        const yScrollTo = yScroll + yDiff;

        // position the zoom slider to trigger layout
        $sliderZoom.css({position: 'absolute'});

        // position view to compensate for new layout
        window.scroll(xScrollTo, yScrollTo);

        // when non-zoom frame is contained within view, desired scroll position may not be possible
        const xScrollAdj = window.scrollX - xScrollTo;
        const yScrollAdj = window.scrollY - yScrollTo;

        const xFrame = Math.max(xDiff, 0) + Math.min(xScrollAdj, 0);
        const yFrame = Math.max(yDiff, 0) + Math.min(yScrollAdj, 0);
        // adjust non-zoom frame to original screen position
        $frame.css({transform: `translate(${xFrame}px, ${yFrame}px)`});

        const {xOrigin, yOrigin} = this.getTransformOrigin($frame, $frameZoom, xCompPagefades, 'in');

        $slider.css({'z-index': 1});
        $sliderZoom.css({opacity: 0});
        $frame.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $el.removeClass('no-transition');
        $frame.addClass('is-zooming').css({transform: `translate(${xFrame}px, ${yFrame}px) scale(${settings.ZOOM_RATIO})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $slider.css({'z-index': ''});
        $sliderZoom.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        $el.addClass('no-transition');
        $slider.css({opacity: 0, 'pointer-events': 'none'});
        $frame.removeClass('is-zooming').css({transform: ''});

        this.forceRepaint();
        $el.removeClass('no-transition');

      // zoom out
      } else {
        const xLeft = $frame.offset().left;
        const yTop  = $frame.offset().top;

        const xDiff = Math.round((w * elX * (120 - 80)) - (xLeft - $frameZoom.offset().left));
        const yDiff = Math.round((h * elY * (120 - 80)) - (yTop  - $frameZoom.offset().top));

        const xMargin = document.documentElement.clientWidth  - $frame.width();
        const yMargin = (xMargin > 0 ? window.innerHeight : document.documentElement.clientHeight) - $frame.height();

        const xMarginLeft = xLeft + xDiff - xScroll;
        const yMarginTop  = yTop  + yDiff - yScroll;

        const xMarginRight  = xScroll + document.documentElement.clientWidth  - (xLeft + xDiff + $frame.width());
        const yMarginBottom = yScroll + document.documentElement.clientHeight - (yTop  + yDiff + $frame.height());

        console.log(`\nx scrollbar... yMargin:${yMargin} yMarginTop:${yMarginTop} = yTop:${yTop} + yDiff:${yDiff} - yScroll:${yScroll}\n`);

        const xScrollAdj = (xMargin > 0
          ? xScroll - (xLeft + xDiff) + Math.max(xMargin / 2, 0)
          : Math.min(-xMarginLeft, 0) + Math.max(xMarginRight, 0) );
        const yScrollAdj = (yMargin > 0
          ? yScroll - (yTop + yDiff) + Math.max(yMargin / 2, 0)
          : Math.min(-yMarginTop, 0) + Math.max(yMarginBottom, 0) );

        // position non-zoom frame in the desired relative location
        const xFrame = xDiff + xScrollAdj;
        const yFrame = yDiff + yScrollAdj;
        $frame.css({transform: `translate(${xFrame}px, ${yFrame}px)`});

        const {xOrigin, yOrigin} = this.getTransformOrigin($frame, $frameZoom, xCompPagefades, 'out');

        $sliderZoom.css({'z-index': 1});
        $slider.css({opacity: 0});
        $frameZoom.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $el.removeClass('no-transition');
        $frameZoom.addClass('is-zooming').css({transform: `scale(${1 / settings.ZOOM_RATIO})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $sliderZoom.css({'z-index': ''});
        $slider.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const xScrollTo = Math.max(window.scrollX - $frame.offset().left, 0);
        const yScrollTo = Math.max(window.scrollY - $frame.offset().top,  0);
        //return;

        $el.addClass('no-transition');
        $sliderZoom.css({opacity: 0, 'pointer-events': 'none'});
        $frameZoom.removeClass('is-zooming').css({transform: ''});
        $frame.css({transform: ''});
        $sliderZoom.css({position: 'fixed'});
        window.scroll(xScrollTo, yScrollTo);

        this.forceRepaint();
        $el.removeClass('no-transition');
      } // zoom out

      this.$store.commit('set', {isZooming:false});

    }, // toggleDpi()

    //------------------------------------------------------------------------------------------------------------------
    // see <https://gist.github.com/paulirish/5d52fb081b3570c81e3a>

    forceRepaint($el = null) {
      ($el || window.$('body')).offset();
    }, // forceRepaint()

    //------------------------------------------------------------------------------------------------------------------

    getTransformOrigin($frame, $frameZoom, xCompPagefades, $zoom) {

      const xOriginAdj = xCompPagefades ? settings.PAGEFADE_WIDTH * ($zoom === 'in' ? settings.ZOOM_RATIO : 1) : 0;

      const xOrigin = ($frame.offset().left - ($frameZoom.offset().left - xOriginAdj)) / ($frameZoom.width() + (xOriginAdj * 2) - $frame.width());
      const yOrigin = ($frame.offset().top - $frameZoom.offset().top) / ($frameZoom.height() - $frame.height());

      return {xOrigin, yOrigin};

    }, // getTransformOrigin()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$frame-unit: $unit;// ($unit / 1em) * 10px;

$layer-pagefades: 2; // raise above prev/next slides
$layer-hover: $layer-pagefades + 1;
$layer-buttons: $layer-hover + 1;

.slider-container {
  opacity: 0;
  transition: opacity .5s ease-in-out;
  &.is-init {
    opacity: 1;
  }
}

.slider {
  position: absolute;
  min-width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  @include short-transition;

  @at-root .no-transition & {
    transition: none;
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

    @at-root .is-init & {
      font-size: inherit;
    }
    @at-root .is-resizing & {
      font-size: 0;
      transition: none;
    }
    @at-root .no-transition & {
      transition: none;
    }

    // TODO
    /*
    cursor: grab;
    @at-root [aria-grabbed] & {
      cursor: grabbing;
    }
    //*/

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
        margin-left:  -$frame-unit * $zoom-ratio;
        padding-left:  $frame-unit * $zoom-ratio;
        margin-right: -$frame-unit * $zoom-ratio;
        padding-right: $frame-unit * $zoom-ratio;
      }

      @at-root .slider-container:not(.is-resizing) .show-pagefades::before { // mask for prev/next slide fades
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        z-index: $layer-pagefades;
        pointer-events: none;
        background: linear-gradient(to right, $background-color, transparent $frame-unit, transparent calc(100% - #{$frame-unit}), $background-color);
        @at-root .slider-container:not(.is-resizing) .dpi120 .show-pagefades::before {
          background: linear-gradient(to right, $background-color, transparent $frame-unit, transparent calc(100% - #{$frame-unit * $zoom-ratio}), $background-color);
        }
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
    .is-resizing &,
    .no-transition & {
      transition: none;
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
      margin-right: ($unit * 1/4 * $zoom-ratio);
    }
    @include short-transition;

    &:not(.active) {
      opacity: 0.5;
    }

    @at-root .has-mouse.has-zoom[data-dpi="80"] .slide.active {
      cursor: zoom-in;
    }
    @at-root .has-mouse.has-zoom[data-dpi="120"] .slide.active {
      cursor: zoom-out;
    }

    // TODO
    @include below-sheet-music-min {
      height: calc(100vh - 10em);
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
        @include absolute-center(x);
        content: 'COPYRIGHTED MATERIAL';
        white-space: nowrap;
        bottom: .5em;
        color: darken($alert-color, 25%);
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;

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
} // .slider

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

.slider-button {
  position: fixed;
  z-index: $layer-buttons;
  top: 50%;
  margin-top: 0;
  transform: translateY(-50%);
  height: 8em;
  width: 4em;
  background: no-repeat center white;
  @include drop-shadow;
  cursor: pointer;
  outline: none;
  @include short-transition;

  @at-root .dpi80 .is-zooming .slider-button {
    transform: translateY(-50%) scale(1 / $zoom-ratio);
  }
  @at-root .dpi120 .is-zooming .slider-button {
    transform: translateY(-50%) scale($zoom-ratio);
  }

  &[disabled] {
    pointer-events: none;
    opacity: 0 !important;
  }

  &.prev {
    left: 0;
    @at-root .dpi120#{&} {
      //left: 2em;
    }
    border-radius: 0 $radius $radius 0;
    transform-origin: right;
  }
  &.next {
    right: 0;
    @at-root .dpi120#{&} {
      //right: 2em;
    }
    border-radius: $radius 0 0 $radius;
    transform-origin: left;
  }
} // .slider-button

</style>
