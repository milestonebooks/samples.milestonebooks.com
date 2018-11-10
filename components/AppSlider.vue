<template>
  <article :class="['slider',sliderClass]" :aria-grabbed="isGrabbing">

    <div class="frame-masks">
      <div v-for="cls of ['side above','side below']" :class="`frame-mask ${cls}`"></div>
    </div>

    <div :class="`frame default dpi${defaultDpi}`">
      <div class="slides">
        <section v-for="slide in slides" :key="slide.index" :data-index="slide.index"
                 :class="`slide ${slideClass(slide)}`" :style="slideStyleSize(slide, defaultDpi)">
          <div class="slide-liner">
            <img v-if="slide.image" :style="imageStyleSize(slide, defaultDpi)" :data-src="imageSrc(slide, defaultDpi)" :data-error="imageError(slide, defaultDpi)" draggable="false"
                 @load="onImageLoaded(slide.index, defaultDpi, $event)" @error="onImageLoadError(slide.index, defaultDpi)" />
            <h1 v-else class="slide-title">{{slide.title ? slide.title : `(${slide.id})` }}</h1>
          </div>
        </section>
      </div>
    </div>

  </article>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import settings from '~/assets/settings';

import sleep from '~/plugins/sleep';
import forceRepaint from '~/plugins/forceRepaint';
import supports3d from '~/plugins/supports3d';
import supportsPassive from '~/plugins/supportsPassive';

import { mapGetters, mapMutations } from 'vuex';

// jQuery-style custom function
window.$.fn.offsetRect = function() {
  return this[0].getBoundingClientRect();
};

export default {
  components: {
    SvgIcon,
  },

  props: {
    slides: Array, // array of objects that must contain {item:String, title:String, ?image:{file:String, h:Number, w:Number, hRatio:Number, loaded:{}}}
    currentIndex: Number,

    images: {

    },

    imageSrc: Function,
    onImageLoaded: Function,
    onImageLoadError: Function,

    defaultDpi: {
      type: Number,
      default: 0,
    }
  },

  data () {
    return {
      isInit:        false,
      isGrabbing:    false,
      isScrolling:   null,
      noTransition:  true,
      width:         null,
      height:        null,
      availWidth:    null,
      availHeight:   null,
      hasScrollbarX: false,
      hasScrollbarY: false,
      slideHeight:   null,
      slideWidth:    null,
      groupHeight:   null,
      touchPoint:    null,
      supports3d:    supports3d(),
      eTouchParams:  supportsPassive() ? { passive: true } : false,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {

    s() {
      return this.$store.state;
    },

    shellClass() {
      return {
        'has-scrollbar-x': this.hasScrollbarX && this.s.scrollbarWidth,
        'has-scrollbar-y': this.hasScrollbarY && this.s.scrollbarWidth,
      }
    },

    sliderClass() {
      return {
        'is-init':  this.isInit,
        'has-prev': !this.isFirst,
        'has-next': !this.isLast,
        'no-transition': this.noTransition,
      }
    },

    isFirst() {
      return this.getSlide && !this.getSlide(-1);
    },

    isLast() {
      return this.getSlide && !this.getSlide(+1);
    },

  }, // computed {}

  //--------------------------------------------------------------------------------------------------------------------

  watch: {

    async currentIndex() {
      // defer to ensure dom is updated
      await this.$nextTick();
      this.update();
    },

    async isInit() {
      // ensure that transitions are only enabled after init is complete
      await this.$nextTick();
      if (this.isInit) this.noTransition = false;
    },

  }, // watch {}

  //====================================================================================================================

  mounted() {
    this.width  = this.$el.offsetWidth;
    this.height = this.$el.offsetHeight;
    this.availWidth  = this.$el.clientWidth;
    this.availHeight = this.$el.clientHeight;
  },

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    async update() {
      //if (process.env.NODE_ENV !== 'production') console.log(`TheSlider update() ${this.currentIndex} @ ${this.s.dpi}`);
      //TODO: this.autosize();
      if (!this.isInit) this.init();
      await this.$nextTick();
      forceRepaint();
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initImages();
      this.isInit = true;
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    initImages() {

      for (const frameType of ['default','zoom']) {
        const observer = new IntersectionObserver((entries, self) => {
          entries = Array.prototype.slice.call(entries, 0); // cast NodeList to Array to support IE/Edge
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.preloadImage(entry.target);
              self.unobserve(entry.target);
            }
          });
        }, {
          // root: use viewport instead of <div.frame>; Chrome uses element net margin (negative margins on .frame are subtracted) for boundary instead of width/height like Firefox
          rootMargin: '100px',
        });

        let images = this.$el.querySelectorAll(`.frame.${frameType} [data-src]`);

        images = Array.prototype.slice.call(images, 0); // cast NodeList to Array to support IE/Edge
        images.forEach(image => { observer.observe(image); });
      }

    }, // initImages()

    //------------------------------------------------------------------------------------------------------------------

    preloadImage(img) {
      const src = img.getAttribute('data-src');
      if (img.src || !src) return;
      img.src = src;
    }, // preloadImage()

    //------------------------------------------------------------------------------------------------------------------

    imageError(i, dpi) {
      return (i.image.loaded[dpi] !== undefined && i.image.loaded[dpi] === false ? 'failed' : null);
    }, // imageError()

    //------------------------------------------------------------------------------------------------------------------

    getSlide(dir = 0, key, currentIndex = null) {
      const i = (currentIndex === null ? this.currentIndex : currentIndex) + dir;
      const slide = (this.slides[i] ? this.slides[i] : null);
      return (slide && key) ? slide[key] : slide;
    }, // getSlide()

    //--------------------------------------------------------------------------------------------------------------------

    slideClass(slide) {
      const i = slide.index;

      return 'item'
        + ` ${i < this.currentIndex ? 'before-' : i > this.currentIndex ? 'after-' : ''}current`
        + (slide.nonsequential ? ' non-' : ' ') + 'sequential-before'
        + (i < this.slides.length - 1 && this.slides[i + 1].nonsequential ? ' non-' : ' ') + 'sequential-after';
    }, // slideClass()

    //------------------------------------------------------------------------------------------------------------------

    slideStyleSize(slide, dpi) {
      const xdpi = slide.image && dpi ? dpi : 1;
      // TODO: taking the width from the clientHeight can cause weird alignment issues on resizing
      let w = slide.image ? Math.ceil(slide.image.w * xdpi) : Math.min(this.availWidth, this.availHeight);
      let h = slide.image ? Math.ceil(slide.image.h * xdpi) : null;

      if (slide.audio) h += 40; // add some vertical padding so sheet music won't be obscured by controls

      // at default zoom, contain slide within view
      if (dpi === settings.DPI_DEFAULT) {
        let wScale = 1;

        if (w > this.width) {
          // if zoomed in, default slides should not count h scrollbar
          const sliderHRatio = (this.s.dpi !== settings.DPI_DEFAULT || this.s.isZooming ? this.height : this.availHeight) / this.width;
          const slideHRatio = h / w;

          wScale = (this.width - (slideHRatio > sliderHRatio ? this.s.scrollbarWidth : 0)) / w;

          // if in the gap between toggling v scrollbar, expand to contain
          if (w * wScale < this.width && h * wScale < this.height) {
            wScale = Math.min(this.width / w, this.height / h);
          }

          w = Math.round(w * wScale);
          h = Math.floor(h * wScale);
        }

        if (slide.image) this.$store.commit('setSampleImageWScale', {i:slide.index, wScale});

        if (slide.index === this.currentIndex) this.set({currentWScale: wScale});
      } // end default dpi

      const width    = `${w}px`;
      const height   = slide.image ? `${h}px` : '';
      const maxWidth = slide.image ? '' : `${settings.SHEET_MUSIC_WIDTH}px`;

      return {width, height, maxWidth};
    }, // slideStyleSize()

    //------------------------------------------------------------------------------------------------------------------

    imageStyleSize(slide, dpi) {
      const x = (dpi || 1) * (dpi === settings.DPI_DEFAULT ? (slide.image.wScale || 1) : 1);
      return {
        width:  `${Math.ceil(slide.image.w * x)}px`,
        height: `${Math.ceil(slide.image.h * x)}px`,
      };
    }, // imageStyleSize()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$layer-frame-mask: 2; // above <.frame> to mask grab zones
$radius-lg: $radius * 2;

//----------------------------------------------------------------------------------------------------------------------

.slider {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  @include short-transition;

  &.no-transition {
    transition: none;
  }
}

//----------------------------------------------------------------------------------------------------------------------

.frame-mask {
  position: absolute;
  z-index: $layer-frame-mask;

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
  [aria-grabbed] .frame-mask {
    display: none;
  }
} // .frame-mask

//----------------------------------------------------------------------------------------------------------------------

.frame {
  position: absolute;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
  @include short-transition;

  @at-root
  .no-transition#{&} {
    transition: none;
  }
} // .frame

//----------------------------------------------------------------------------------------------------------------------

.slides {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;

  #{$isIE} & {
    display: inline-block;
  }
  @include short-transition;

  @at-root .no-transition#{&} {
    transition: none;
  }

  cursor: grab;
  #{$isIE} & {
    cursor: move;
  }
  @at-root [aria-grabbed]#{&} {
    cursor: grabbing;
  }
} // .slides

//----------------------------------------------------------------------------------------------------------------------

.slide {
  position: relative;
  display: inline-block;
  vertical-align: text-top;
  text-align: center;
  background-color: white;
  margin: 0 ($unit * 1/8);

  @at-root
  [data-dir="ltr"] &:first-child,
  [data-dir="rtl"] &:last-child {
    margin-left: 0;
  }

  @at-root
  [data-dir="ltr"] &:last-child,
  [data-dir="rtl"] &:first-child {
    margin-right: 0;
  }

  @include short-transition;

  &:not(.current) {
    opacity: 0.25;
  }

  // prev/next cursors
  @at-root
  [data-dir="ltr"] .slider:not([aria-grabbed]) .slide.before-current,
  [data-dir="rtl"] .slider:not([aria-grabbed]) .slide.after-current {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M5,16 l 16,-16 2,2 -14,14 14,14 -2,2z' fill='#{$theme-color-data-uri}' /%3E%3C/svg%3E") 16 16, grab;
  }
  @at-root
  [data-dir="ltr"] .slider:not([aria-grabbed]) .slide.after-current,
  [data-dir="rtl"] .slider:not([aria-grabbed]) .slide.before-current {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M27,16 l -16,-16 -2,2 14,14 -14,14 2,2z' fill='#{$theme-color-data-uri}' /%3E%3C/svg%3E") 16 16, grab;
  }

  &::before {
    z-index: 1; // make sure it's above <img>
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
  }

  img {
    // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cstyle type='text/css'%3E .c1, .c2 %7B transform-origin: 100px 100px; animation: x 2s ease-out infinite; %7D .c2 %7B animation-delay:-1s; %7D @keyframes x %7B from %7B transform: scale%280%29; opacity:.5; %7D to %7B transform:scale%281.0%29; opacity:0; %7D %7D %3C/style%3E%3Ccircle class='c1' cx='100' cy='100' r='20' fill='black' /%3E%3Ccircle class='c2' cx='100' cy='100' r='20' fill='black' /%3E%3C/svg%3E") no-repeat center / cover;

    &[data-error] {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='-100 -100 400 400'%3E%3Cstyle type='text/css'%3E .sad %3E * %7B transform-origin: 100px 100px; animation: sad 1s ease-in forwards; %7D @keyframes sad %7B from %7B opacity: 0; transform: scale(0); %7D to %7B opacity: 1; %7D %7D .face %3E * %7B opacity: .25; %7D .teardrop %7B transform-origin: 15px 3px; opacity: .25; animation-delay: -1s; animation: t 5s ease-out infinite; %7D @keyframes t %7B from, 40%25 %7B transform: translate(94px, 95px) scale(0); %7D 95%25 %7B transform: translate(94px, 95px) scale(.15); %7D to %7B transform: translate(94px, 140px) scale(.15); %7D %7D text %7B fill: red; font-family: Arial, Helvetica, sans-serif; font-size: 10px; text-anchor: middle; %7D %3C/style%3E%3Cg class='sad'%3E%3Cg class='face'%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='black' stroke-width='4' /%3E%3Ccircle cx='94' cy='95' r='3' fill='black' /%3E%3Ccircle cx='106' cy='95' r='3' fill='black' /%3E%3Cpath d='M 90,109 a 12 12 0 0 1 20,0' stroke='black' stroke-width='2' stroke-linecap='round' fill='none' /%3E%3C/g%3E%3Cpath class='teardrop' fill='black' d='M15 3 Q16.5 6.8 25 18 A12.8 12.8 0 1 1 5 18 Q13.5 6.8 15 3z' /%3E%3Ctext x='100' y='150'%3Eimage failed to load%3C/text%3E%3C/g%3E%3C/svg%3E");
    }
  }

  .slide-title {
    font-size: 2.5em;
    margin: 2rem;
    white-space: normal;

    &::after {
      content: '';
      display: block;
      width: 100%;
      margin-top: 5vh;
      height: 20vh;
      // icon sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M0,6 v6 h4 l5,5 v-16 l-5,5 h-4 z' /%3E%3Cpath d='M13.5,9 c0,-1.8 -1,-3.3 -2.5,-4 v8 c1.5,-0.7 2.5,-2.2 2.5,-4 z' /%3E%3Cpath d='M11,.2 v2 c3,1 5,3.6 5,6.8 s-2,5.8 -5,6.7 v2 c4,-0.8 7,-4.4 7,-8.7 s-3,-8 -7,-8.8 z' /%3E%3C/svg%3E") no-repeat center;
      opacity: .05;
    }
  }

} // .slide

//----------------------------------------------------------------------------------------------------------------------

.sidebar {
  z-index: $layer-item-view + 1;
  height: 8em;
  @include short-transition;

  &.disabled {
    pointer-events: none;
    opacity: 0 !important;
  }

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;
    border-radius: 0 $radius-lg $radius-lg 0;
  }

  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;
    border-radius: $radius-lg 0 0 $radius-lg;
    svg {
      transform: translate(-50%, -50%) rotate(180deg);
    }
  }

  .btn {
    width: 100%;
    height: 100%;
    @include short-transition;

    svg {
      width: 3em;
      height: 6em;
    }
  }
} // .sidebar

//----------------------------------------------------------------------------------------------------------------------

</style>
