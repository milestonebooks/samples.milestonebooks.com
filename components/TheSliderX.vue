<template>
  <article :class="sliderClass" :aria-grabbed="isGrabbing">
    <div class="frame-mask end prev"></div>
    <div class="frame-mask end next"></div>
    <div class="frame-mask side above"></div>
    <div class="frame-mask side below"></div>

    <div class="frame" data-dpi="80">
      <div class="slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                 :class="`slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 80)" @click="onclickSlide">
          <div class="slide-liner">
            <img v-if="sample.image" :src="imgSrc(sample, 80)" @load="imgLoaded(sample.index, 80)" draggable="false" />
            <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
          </div>
        </section>
      </div>
    </div>

    <div v-if="s.hasZoom" class="frame" data-dpi="120">
      <div class="slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                 :class="`slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 120)" @click="onclickSlide">
          <div class="slide-liner">
            <img :src="imgSrc(sample, 120)" @load="imgLoaded(sample.index, 120)" draggable="false" />
          </div>
        </section>
      </div>
    </div>

    <nuxt-link class="btn btn-slider prev ltr" :tabindex="0" :to="'#' + getSample(-1, 'id')" replace :disabled="isFirst" aria-label="Previous sample" tag="button">
      <SvgIcon view="24 48" :d="btnSliderPath"></SvgIcon>
    </nuxt-link>
    <nuxt-link class="btn btn-slider next ltr" :tabindex="0" :to="'#' + getSample(+1, 'id')" replace :disabled="isLast" aria-label="Next sample" tag="button">
      <SvgIcon view="24 48" :d="btnSliderPath"></SvgIcon>
    </nuxt-link>

  </article>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import settings from '~/assets/settings';

import sleep from '~/plugins/sleep';

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
      isInit:       false,
      //isInit80:     false,
      //isInit120:    false,
      isGrabbing:   false,
      isResizing:   false,
      noTransition: true,
      viewHeight:   document.documentElement.clientHeight,
      viewWidth:    document.documentElement.clientWidth,
      slideHeight:  null,
      slideWidth:   null,
      groupHeight:  null,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters([
      'getSample',
      'listItemClass',
    ]),

    s() {
      return this.$store.state;
    },

    isFirst() {
      return this.getSample && !this.getSample(-1);
    },

    isLast() {
      return this.getSample && !this.getSample(+1);
    },

    btnSliderPath() {
      return 'M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z'; // right-pointing: 'M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z'
    },

    /* obsolete?
    isInit() {
      return this.isInit80 && (this.s.hasZoom ? this.isInit120 : true);
    },
    //*/

    sliderClass() {
      return {
        'slider': true,
        'is-init': this.isInit,
        'is-resizing': this.isResizing,
        'no-transition': this.noTransition,
        'has-prev': !this.isFirst,
        'has-next': !this.isLast,
      }
    }, // sliderClass()

  }, // computed {}

  //--------------------------------------------------------------------------------------------------------------------

  watch: {
    samples() { this.init() },
    currentIndex() {
      // defer to ensure dom is updated
      this.$nextTick(() => {
        this.update();
      });
    },
    isInit() {
      // ensure that transitions are only enabled after init is complete
      this.$nextTick(() => {
        if (this.isInit) this.noTransition = false;
      });
    },
  },

  //====================================================================================================================

  mounted() {
    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize);
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    init() {
      console.log('init', this.s.samples.length);

      /* experimental
      const style = document.createElement('style');
      document.head.appendChild(style);

      this.stylesheet = style.sheet;

      console.log(`stylesheet @ ${this.viewWidth}w X ${this.viewHeight}h:`, this.stylesheet.cssRules);
      //*/

      // TODO
      this.$nextTick(() => {
        this.$el.addEventListener('on.lory.touchstart', () => this.isGrabbing = true);
        this.$el.addEventListener('on.lory.touchend',   () => this.isGrabbing = false);
      });

      this.isInit = true;
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    onResize() {
      // this is needed to ensure that font-size = 0 when lory resize calculations occur
      this.isResizing = true;

      this.viewHeight = document.documentElement.clientHeight;
      this.viewWidth  = document.documentElement.clientWidth;

      console.log(`onresize: ${this.viewWidth}w X ${this.viewHeight}h`);

      clearTimeout(window._resizeT);

      window._resizeT = setTimeout(async () => {
        this.autosize({resize:true});
        await this.forceRepaint();
        this.isResizing = false;
      }, settings.TRANSITION_TIME_MS);

    }, // onResize()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      console.log(`update(init:${this.isInit}, i:${this.currentIndex})`);
      if (!this.isInit) return;

      // position active slide

      this.autosize();
    }, // update()

    //------------------------------------------------------------------------------------------------------------------
    // TODO: remove
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

    autosize({resize = false, dpi = 80} = {}) {
      const index = this.currentIndex;

      const $slider = window.$('.slider');

      const $frame  = $slider.find(`.frame[data-dpi="${dpi}"]`);
      const $slides = $frame.find('.slides');
      const $slide  = $slides.find(`.slide[data-index="${index}"]`);

      const height = Math.ceil($slide.height());
      const width  = Math.ceil($slide.width());

      const $slidePrev = $slide.prev();
      const $slideNext = $slide.next();

      const frameHeight = Math.ceil(Math.max(height, this.viewHeight));
      const frameWidth  = Math.ceil(Math.max(width,  this.viewWidth));

      // this determines how much gutter space is masked from being grabbable for sliding
      const groupHeight = Math.max(height, $slidePrev.length ? $slidePrev.height() : 0, $slideNext.length ? $slideNext.height() : 0);

      if (resize || height !== this.slideHeight || width !== this.slideWidth || groupHeight !== this.groupHeight) {

        this.slideHeight = height;
        this.slideWidth  = width;
        this.groupHeight = groupHeight;

        const xMargin = Math.max(this.viewWidth - width, 0) / 2;
        const yMargin = Math.max(this.viewHeight - groupHeight, 0) / 2;

        $slider.css({
          'min-height': `${this.viewHeight}px`
        });

        $frame.css({
          height: `${frameHeight}px`,
          width:  `${frameWidth}px`,
          'margin-left':   `${-xMargin}px`,
          'padding-left':  `${ xMargin}px`,
          'margin-right':  `${-xMargin}px`,
          'padding-right': `${ xMargin}px`,
        });

        if (dpi === this.s.dpi) {
          window.$('.frame-mask.end').css({width: `${xMargin}px`});
          window.$('.frame-mask.side').css({height: `${yMargin}px`});
        }
      }

      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      const xOffset = $slide[0].getBoundingClientRect()[metric] - $slides[0].getBoundingClientRect()[metric];
      // [2018-06-29] IE11 (Trident) still has 5% usage and does not support flexbox (so slides are not vertically centered)
      const yOffset = navigator.userAgent.match(/Trident/) ? 0 : Math.floor(($slides.height() - frameHeight) / 2);

      $slides.css({
        'transform': `translate3d(${-xOffset}px, ${-yOffset}px, 0)`,
      });

      if (dpi === 80 && this.s.hasZoom) this.autosize({resize, dpi:120});
    }, // autosize()

    //------------------------------------------------------------------------------------------------------------------

    sampleStyleSize(sample, dpi = 80) {
      const xdpi = sample.image ? dpi : 1;
      const w    = sample.image ? Math.ceil(sample.image.w * xdpi) : Math.min(this.viewWidth, document.documentElement.clientHeight);
      let   h    = sample.image ? Math.ceil(sample.image.h * xdpi) : null; //Math.ceil(window.$(`.slide[data-index="${sample.index}"] .slide-liner`).height());

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

      //console.log(`sampleStyleSize(): viewWidth:${this.viewWidth}`); // w:${width} h:${height}`);

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
      const index = e.target.getAttribute('data-index');

      if (index === null) return;

      console.log('onclickSlide()', `index:${index} active:${this.s.currentIndex} target:${e.target.getAttribute('data-index')}`, e);

      if (Number(index) !== this.s.currentIndex) {
        console.log(`go to:#${this.s.samples[index].id}`);
        return;
        //return this.$router.replace(`#${this.s.samples[index].id}`);
      }

      // TODO: abort zoom if panning instead of clicking

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

      const $el         = window.$('.slider');
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
$layer-hover:     $layer-pagefades + 1;
$layer-buttons:   $layer-hover + 1;

.slider {
  position: absolute;
  min-width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  @include short-transition;

  &.is-resizing,
  &.no-transition {
    transition: none;
  }

  .frame-mask {
    position: fixed;
    z-index: 1; // above .frame to mask grab zones

    &.end {
      top: 0;
      bottom: 0;
    }

    &.side {
      left: 0;
      right: 0;
      &.above {
        top: 0;
      }
      &.below {
        bottom: 0;
      }
    }

    @at-root
    [data-dir="ltr"] .frame-mask.prev,
    [data-dir="rtl"] .frame-mask.next {
      left: 0;
    }
    @at-root
    [data-dir="ltr"] .frame-mask.next,
    [data-dir="rtl"] .frame-mask.prev {
      right: 0;
    }

    @at-root
    .slider.has-prev .frame-mask.prev,
    .slider.has-next .frame-mask.next {
      display: none;
    }
  }

  .frame {
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
    white-space: nowrap;
    @include short-transition;

    @at-root
    .is-resizing#{&},
    .no-transition#{&} {
      transition: none;
    }

    &[data-dpi="120"] {
      position: fixed;
      pointer-events: none;
      opacity: 0;
    }

    /* TODO: wait until sliding is enabled
    cursor: grab;
    @at-root [aria-grabbed] & {
      cursor: grabbing;
    }
    //*/
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
    @include short-transition;

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
    margin: 0 ($unit * 1/8);
    @at-root .frame[data-dpi="120"] .slide {
      margin: 0 ($unit * 1/8 * $zoom-ratio);
    }
    @include short-transition;

    &:not(.current) {
      opacity: 0.25;
    }

    @at-root .has-mouse.has-zoom[data-dpi="80"] .slide.current {
      cursor: zoom-in;
    }
    @at-root .has-mouse.has-zoom[data-dpi="120"] .slide.current {
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

.btn-slider {
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

  &[disabled] {
    pointer-events: none;
    opacity: 0 !important;
  }

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;
    border-radius: 0 $radius $radius 0;
  }
  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;
    border-radius: $radius 0 0 $radius;
    svg {
      transform: translate(-50%, -50%) rotate(180deg);
    }
  }
} // .btn-slider

</style>
