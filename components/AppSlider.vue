<template>
  <article class="slider-frame" :class="frameClass">

    <article class="slider-view">
      <article ref="slider" :class="['slider',sliderClass]" :aria-grabbed="isGrabbing">

        <div class="frame-masks">
          <div v-for="cls of ['side above','side below']" :class="`frame-mask ${cls}`"></div>
        </div>

        <div v-for="frame of frames" :class="`frame ${frame.type} dpi${frame.dpi}`">
          <div class="slides">
            <section v-for="slide in slides" :key="slide.index" :data-index="slide.index"
                     :class="`slide ${slideClass(slide)}`" :style="slideStyleSize(slide, frame.dpi)">
              <div class="slide-liner">
                <img v-if="slide.image" :style="imageStyleSize(slide, frame.dpi)" :data-src="imageSrc(slide, frame.dpi)" :data-error="imageError(slide, frame.dpi)" draggable="false"
                     @load="onImageLoaded(slide.index, frame.dpi, $event)" @error="onImageLoadError(slide.index, frame.dpi)" />
                <h1 v-else class="slide-title">{{slide.title ? slide.title : `(${slide.id})` }}</h1>
              </div>
            </section>
          </div>
        </div>

      </article>
    </article>

    <aside :class="`sidebar prev v ${isFirst ? 'disabled' : ''}`">
      <nuxt-link class="btn btn-slider prev ltr" :tabindex="0" :to="'#' + getSlide(-1, 'id')" replace aria-label="previous sample" tag="button">
        <SvgIcon view="24 48" :d="btnPrevPath"></SvgIcon>
      </nuxt-link>
    </aside>
    <aside :class="`sidebar next v ${isLast ? 'disabled' : ''}`">
      <nuxt-link class="btn btn-slider next ltr" :tabindex="0" :to="'#' + getSlide(+1, 'id')" replace aria-label="next sample" tag="button">
        <SvgIcon view="24 48" :d="btnPrevPath"></SvgIcon>
      </nuxt-link>
    </aside>

    <slot name="frame"></slot>

    <article class="slider-pane">
      <slot name="pane"></slot>
    </article>

  </article>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import settings from '~/assets/settings';

import '~/plugins/jQuery.offsetRect';

import sleep from '~/plugins/sleep';
import forceRepaint from '~/plugins/forceRepaint';
import supports3d from '~/plugins/supports3d';
import supportsPassive from '~/plugins/supportsPassive';

import { mapGetters, mapMutations } from 'vuex';

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
    },
    zoomDpi: {
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
      minSheetMusicWidth: null,
      hasScrollbarX: false,
      hasScrollbarY: false,
      slideHeight:   null,
      slideWidth:    null,
      groupHeight:   null,
      touchPoint:    null,
      supports3d:    supports3d(),
      eTouchParams:  supportsPassive() ? { passive: true } : false,
      tResize:       null,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {

    s() {
      return this.$store.state;
    },

    frameClass() {
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
        'has-zoom': this.hasZoom,
        'no-transition': this.noTransition,
      }
    },

    hasZoom() {
      return (this.zoomDpi !== 0);
    },

    frames() {
      const frames = [{type:'default', dpi:this.defaultDpi}];
      if (this.zoomDpi) frames.push({type:'zoom', dpi:this.zoomDpi});
      return frames;
    },

    isFirst() {
      return this.getSlide && !this.getSlide(-1);
    },

    isLast() {
      return this.getSlide && !this.getSlide(+1);
    },

    btnPrevPath() {
      return 'M1,24 l 18,-18 2,2 -16,16 16,16 -2,2z'; // right-pointing: 'M23,24 l -18,-18 -2,2 16,16 -16,16 2,2z'
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

    minSheetMusicWidth() {
      window.$(this.$el).closest('.app-frame')
        .toggleClass('below-sheet-music-width', !this.minSheetMusicWidth)
        .toggleClass('min-sheet-music-width',    this.minSheetMusicWidth);
    },

    's.isResizing'() {
      // hack to compensate for race conditions
      if (!this.s.isResizing) {
        setTimeout(() => {
          this.autosize({resize:true});
        }, settings.TRANSITION_TIME_MS * 2);
      }
    },

  }, // watch {}

  //====================================================================================================================

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.$el.addEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.addEventListener('mousedown',  this.onTouchstart);
    this.onResize();
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize);
    this.$el.removeEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.removeEventListener('mousedown',  this.onTouchstart);
  },

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    async update() {
      //if (process.env.NODE_ENV !== 'production') console.log(`TheSlider update() ${this.currentIndex} @ ${this.s.dpi}`);
      this.autosize();
      if (!this.isInit) this.init();
      await this.$nextTick();
      forceRepaint();
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    onResize() {
      const el = window.$(this.$el).find('.slider-view')[0];
      this.width  = el.getBoundingClientRect().width;
      this.height = el.getBoundingClientRect().height;

      this.minSheetMusicWidth = this.width >= settings.SHEET_MUSIC_WIDTH;

      this.availWidth  = this.width  - (el.offsetWidth  - el.clientWidth);
      this.availHeight = this.height - (el.offsetHeight - el.clientHeight);

      // delay autosize() until above settings are propagated in layout

      clearTimeout(this.tResize);

      this.tResize = setTimeout(() => {
        this.autosize({resize:true});
      }, settings.TRANSITION_TIME_MS);

    }, // onResize()

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

        let images = this.$refs.slider.querySelectorAll(`.frame.${frameType} [data-src]`);

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
      if (!dpi) return;

      const xdpi = slide.image && dpi ? dpi : 1;

      const $el = window.$(this.$el).find(`.frame.dpi${dpi} .slide[data-index="${slide.index}"]`);
      const nonImgWidth = Math.floor(Math.min(this.availWidth, (this.s.isResizing && $el.length ? parseFloat($el.css('width').replace(/\D/g,'')) : this.availHeight)));

      let w = slide.image ? Math.ceil(slide.image.w * xdpi) : nonImgWidth;
      let h = slide.image ? Math.ceil(slide.image.h * xdpi) : null;

      let wScale = 1;

      // at default zoom, contain slide within view
      if (dpi === settings.DPI_DEFAULT) {

        if (w > this.availWidth) {
          // if zoomed in, default slides should not count h scrollbar
          const sliderHRatio = (this.s.dpi !== settings.DPI_DEFAULT || this.s.isZooming ? this.height : this.availHeight) / this.width;
          const slideHRatio = h / w;

          wScale = (this.width - (slideHRatio > sliderHRatio ? this.s.scrollbarWidth : 0)) / w;

          // if in the gap between toggling v scrollbar, expand to contain
          if (w * wScale < this.width && h * wScale < this.height) {
            wScale = Math.min(this.width / w, this.height / h);
          }

          w = Math.floor(w * wScale);
          h = Math.floor(h * wScale);
        }

        if (slide.image) this.$store.commit('setSampleImageWScale', {i:slide.index, wScale});

        if (slide.index === this.currentIndex) this.set({currentWScale: wScale});
      } // end default dpi

      // add some vertical padding so sheet music title/credits won't be obscured by controls
      if (slide.audio && slide.image) h += Math.floor(settings.CONTROLS_HEIGHT / wScale);

      const width     = `${w}px`;
      const height    = slide.image ? `${h}px` : '';
      const maxWidth  = !slide.image ? `${settings.SHEET_MUSIC_WIDTH}px` : '';

      //console.log(`slideStyleSize(#${slide.id}, @${dpi}) w:${width}, h:${height} | availHeight:${this.availHeight} | maxW:${maxWidth} ${this.s.isResizing ? '--resizing--' : ''}`, slide.id);

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

    onTouchstart(e) {
      const touches = e.touches ? e.touches[0] : e;

      /*
      const isMultiTouch = e.touches && e.touches.length > 0;
      //if (isMultiTouch && this.s.dpi === settings.DPI_DEFAULT) window.$('[name="viewport"]').attr('content','width=device-width, initial-scale=1, minimum-scale=.5, maximum-scale=2');
      if (isMultiTouch && this.s.dpi === settings.DPI_DEFAULT) window.$('[name="viewport"]').attr('content','width=device-width');
      //*/

      const $slides = window.$(touches.target).closest('.slides');

      if (!$slides.length) return;

      const el = $slides.closest('.frame')[0];

      el.addEventListener('touchmove', this.onTouchmove, this.eTouchParams);
      el.addEventListener('mousemove', this.onTouchmove);
      el.addEventListener('touchend',  this.onTouchend);
      el.addEventListener('mouseup',   this.onTouchend);

      const {pageX, pageY} = touches;

      const {xOffset, yOffset} = this.getSlideOffset($slides.find(`[data-index="${this.currentIndex}"]`));

      this.touchPoint = {
        time: Date.now(),
        el: el,
        slidesX: xOffset,
        slidesY: yOffset,
        x: pageX,
        y: pageY,
        deltaX: 0,
        deltaY: 0,
      };

      this.isScrolling = null;

    }, // onTouchstart()

    //------------------------------------------------------------------------------------------------------------------

    onTouchmove(e) {
      const touches = e.touches ? e.touches[0] : e;

      const {pageX, pageY} = touches;

      this.touchPoint.deltaX = pageX - this.touchPoint.x;
      this.touchPoint.deltaY = pageY - this.touchPoint.y;

      if (this.isScrolling === null) {
        this.isScrolling = !!(this.isScrolling || (Math.abs(this.touchPoint.deltaX) < Math.abs(this.touchPoint.deltaY) && e.type !== 'mousemove'));
      }

      if (!this.isScrolling) {
        this.isGrabbing = true;
        this.noTransition = true;

        const $slides = window.$(this.touchPoint.el).find('.slides');
        const XY = `${-this.touchPoint.slidesX + this.touchPoint.deltaX}px, ${-this.touchPoint.slidesY}px`;
        $slides.css({
          'transform': (this.supports3d ? `translate3d(${XY}, 0)` : `translate(${XY})`),
        });
      }
    }, // onTouchmove()

    //------------------------------------------------------------------------------------------------------------------

    onTouchend(e) {
      /*
      const isMultiTouch = e.touches && e.touches.length > 1;
      if (!isMultiTouch) window.$('[name="viewport"]').attr('content','width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1');
      //*/

      // cleanup
      const el = this.touchPoint.el;
      el.removeEventListener('touchmove', this.onTouchmove, this.eTouchParams);
      el.removeEventListener('mousemove', this.onTouchmove);
      el.removeEventListener('touchend',  this.onTouchend);
      el.removeEventListener('mouseup',   this.onTouchend);

      this.touchPoint.el = null;

      this.isScrolling = null;

      this.isGrabbing = false;

      this.noTransition = false;

      // decide what the interaction means
      let action = 'click';
      const duration = Date.now() - this.touchPoint.time;
      const diffX = Math.abs(this.touchPoint.deltaX);
      const diffY = Math.abs(this.touchPoint.deltaY);
      const dir = (this.touchPoint.deltaX < 0 ? 'left' : 'right');

      const slideWidth = window.$(this.$el).find(`.frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"]`).width();

      // greater than a third the slide width or a fast flick
      if (diffX > slideWidth / 3 || (duration < 300 && diffX > 25 && diffX > diffY)) {
        action = 'swipe';
      }

      let index = this.currentIndex;
      let elIndex = null;

      // main button, quickly, without moving, on a slide
      const isSlideClick = e.button === 0 && duration < 300 && diffX < 5 && (elIndex = e.target.getAttribute('data-index')) !== null;

      if (action === 'swipe') {
        index += ((dir === 'left' && this.s.direction === 'ltr') || (dir === 'right' && this.s.direction === 'rtl') ? 1 : -1);
      } else if (isSlideClick) {
        index = Number(elIndex);
        if (index === this.currentIndex && this.s.hasZoom) {
          action = 'zoom';
        }
      }

      if (action === 'zoom') {
        this.toggleDpi({
          elX: e.offsetX / e.target.getBoundingClientRect().width,
          elY: e.offsetY / e.target.getBoundingClientRect().height,
        });

      } else if (index !== this.currentIndex && this.s.samples[index]) {
        this.$router.replace(`#${this.s.samples[index].id}`);

      } else {
        // [2018-09-12] ensures 'no-transition' class is removed in Firefox; forceRepaint() doesn't seem to do the trick
        this.$nextTick(() => {
          this.autosize();
        });
      }
    }, // onTouchend()

    //------------------------------------------------------------------------------------------------------------------

    autosize({resize = false} = {}) {
      const frameType = (this.s.dpi === settings.DPI_DEFAULT ? 'default' : 'zoom');

      // the IntersectionObserver [see initImages()] will lazy-load images in the sequence of crossing the threshold
      // the following ensures the current image loads first, which is useful when scrolling past many slides via the nav list
      if (this.slides[this.currentIndex].image) {
        this.preloadImage(this.$refs.slider.querySelector(`.frame.${frameType} [data-index="${this.currentIndex}"] img`));
      }

      const $slider = window.$(this.$refs.slider);
      const $frame  = $slider.find(`.frame.${frameType}`);
      const $slides = $frame.find('.slides');
      const $slide  = $slides.find(`.slide[data-index="${this.currentIndex}"]`);

      const width  = Math.ceil($slide.width());
      const height = Math.ceil($slide.height());

      const $slidePrev = $slide.prev();
      const $slideNext = $slide.next();

      // scrollbars can sometimes be present that won't actually be needed for the actual slide size
      const {needsScrollbar} = this.checkScrollbars({width, height});

      this.availWidth  = this.width  - (needsScrollbar.y ? this.s.scrollbarWidth : 0);
      this.availHeight = this.height - (needsScrollbar.x ? this.s.scrollbarWidth : 0);

      const frameWidth  = Math.floor(Math.max(width,  this.availWidth));
      const frameHeight = Math.floor(Math.max(height, this.availHeight - (!this.minSheetMusicWidth ? settings.CONTROLS_HEIGHT : 0) ));

      // this determines how much gutter space is masked from being grabbable for sliding
      const groupHeight = Math.max(height, $slidePrev.length ? $slidePrev.height() : 0, $slideNext.length ? $slideNext.height() : 0);

      if (resize || width !== this.slideWidth || height !== this.slideHeight || groupHeight !== this.groupHeight) {

        this.slideWidth  = width;
        this.slideHeight = height;
        this.groupHeight = groupHeight;

        const xMargin = Math.max(this.availWidth - width, 0) / 2;
        const yMargin = Math.max(this.availHeight - groupHeight, 0) / 2;

        $slider.css({
          width:  `${frameWidth}px`,
          height: `${frameHeight}px`,
        });
        window.$(this.$refs.slider).find('.frame-mask.side').css({height: `${yMargin}px`});

        $frame.css({
          width:  `${frameWidth}px`,
          height: `${frameHeight}px`,
          left:            `${ xMargin}px`,
          'margin-left':   `${-xMargin}px`,
          'padding-left':  `${ xMargin}px`,
          'margin-right':  `${-xMargin}px`,
          'padding-right': `${ xMargin}px`,
        });
      }

      const {xOffset, yOffset} = this.getSlideOffset($slide);
      const XY = `${-xOffset}px, ${-yOffset}px`;

      $slides.css({
        transform: (this.supports3d ? `translate3d(${XY}, 0)` : `translate(${XY})`),
      });

      if (this.noTransition) forceRepaint();
    }, // autosize()

    //------------------------------------------------------------------------------------------------------------------

    checkScrollbars({width, height}) {
      const hasScrollbarX = this.availHeight < this.height;
      const hasScrollbarY = this.availWidth  < this.width;
      const needsScrollbarX = (width  > this.width  || (width  > this.availWidth  && height > this.height)) && this.s.dpi !== settings.DPI_DEFAULT;
      const needsScrollbarY = (height > this.height || (height > this.availHeight && width  > this.width ));

      this.hasScrollbarX = needsScrollbarX;
      this.hasScrollbarY = needsScrollbarY;

      return {
        hasScrollbar: {x:hasScrollbarX, y:hasScrollbarY},
        needsScrollbar: {x:needsScrollbarX, y:needsScrollbarY},
      };
    }, // checkScrollbars()

    //------------------------------------------------------------------------------------------------------------------

    getSlideOffset($slide) {
      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      const $slides = $slide.closest('.slides');
      const height = Math.ceil($slide.height());
      const frameHeight = Math.ceil(Math.max(height, this.availHeight));

      const xOffset = $slide.offsetRect()[metric] - $slides.offsetRect()[metric];
      let yOffset = Math.floor(($slides.height() - frameHeight) / 2);

      // [2018-11] IE11 (Trident) still has ~5% usage and does not support flexbox (so slides are not vertically centered)
      if (navigator.userAgent.match(/Trident/) && yOffset > settings.CONTROLS_HEIGHT) yOffset = -settings.CONTROLS_HEIGHT;

      return {xOffset, yOffset};
    }, // getSlideOffset()

    //------------------------------------------------------------------------------------------------------------------

    async toggleDpi({elX = 0.5, elY = 0.5} = {}) {

      if (this.s.isZooming) return;

      this.set({isZooming:true});

      const dpi = (this.s.dpi === settings.DPI_DEFAULT ? settings.DPI_ZOOM : settings.DPI_DEFAULT);
      this.set({dpi});

      // `user-scaleable=no` prevents zooming jank in mobile Chrome (caused by browser resizing window.innerWidth)
      window.$('[name="viewport"]').attr('content',`width=device-width, initial-scale=1, ${dpi === settings.DPI_DEFAULT ? 'minimum-scale=1' : 'maximum-scale=1, user-scalable=no'}`);

      const zoomIn = (dpi === settings.DPI_ZOOM);

      const index = this.currentIndex;

      const $el        = window.$(this.$el);
      const el         = $el.find('.slider-view')[0];
      const $slider    = $el.find('.slider');
      const $frame     = $slider.find('.frame.dpi80');
      const $frameZoom = $slider.find('.frame.dpi120');
      const $slide     = $frame.find(`[data-index="${index}"]`);
      const $slideZoom = $frameZoom.find(`[data-index="${index}"]`);
      const $rulers    = $el.find('.rulers');

      // ensure no transitions are in effect to delay prep layout
      this.noTransition = true;
      await this.$nextTick();

      const w = this.s.samples[index].image.w;
      const h = this.s.samples[index].image.h;

      const xScroll = el.scrollLeft;
      const yScroll = el.scrollTop;

      // TODO: 'rtl' zoom-in is buggy
      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      if (zoomIn) {
        /*
        const xOffset = $slide.offsetRect()[metric];
        const yOffset = Math.max($slide.offset().top, 0);
        /*/
        const xOffset = $slide.offsetRect()[metric] - $el.offsetRect()[metric];
        const yOffset = Math.max($slide.offset().top - $el.offset().top, 0);
        //*/
        const dpiDiff = settings.DPI_ZOOM - (settings.DPI_DEFAULT * this.s.currentWScale);

        const xDiff = Math.round((w * elX * dpiDiff) - xOffset);
        const yDiff = Math.round((h * elY * dpiDiff) - yOffset);

        const xScrollTo = xScroll + xDiff;
        const yScrollTo = yScroll + yDiff;

        // position the zoom slider to trigger layout and image loading
        $frameZoom.css({display: 'block', position: 'absolute'});
        this.autosize({resize:true});

        // position view to compensate for new layout
        el.scrollLeft = xScrollTo;
        el.scrollTop  = yScrollTo;

        // when non-zoom frame is contained within view, desired scroll position may not be possible
        const xScrollAdj = el.scrollLeft - xScrollTo;
        const yScrollAdj = el.scrollTop - yScrollTo;

        const xFrame = Math.max(xDiff, 0) + Math.min(xScrollAdj, 0);
        const yFrame = Math.max(yDiff, 0) + Math.min(yScrollAdj, 0);

        // adjust non-zoom frame to original screen position
        $frame.css({transform: `translate(${xFrame}px, ${yFrame}px)`});

        // find origin that will scale to final position
        const xPct = ($slide.offsetRect()[metric] - $slideZoom.offsetRect()[metric]) / ($slideZoom.width() - $slide.width());
        const yPct = ($slide.offset().top - $slideZoom.offset().top) / ($slideZoom.height() - $slide.height());

        const xOrigin = (xOffset + ($slide.width()  * xPct)) / $frame.width();
        const yOrigin = (yOffset + ($slide.height() * yPct)) / $frame.height();
        const scale   = settings.ZOOM_RATIO / this.s.currentWScale;

        $frame.css({'z-index': 1});
        $frameZoom.css({opacity: 0});
        $frame.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});
        $rulers.addClass('no-transition').css({transform: `scale(${1 / scale})`});

        // ensure dom is updated before running zoom transition
        forceRepaint();
        this.noTransition = false;
        await this.$nextTick();

        $frame.addClass('is-zooming').css({transform: `translate(${xFrame}px, ${yFrame}px) scale(${scale})`});
        $rulers.removeClass('no-transition').css({transform: ''});

        // zoom
        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frame.css({'z-index': ''});
        $frameZoom.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        this.noTransition = true;
        await this.$nextTick();

        $frame.css({opacity: 0, 'pointer-events': 'none'});
        $frame.removeClass('is-zooming').css({transform: ''});

        // zoom out
      } else {
        const elOffset = {
          left: el.scrollLeft - $el.offset().left,
          top:  el.scrollTop  - $el.offset().top,
        };

        // offset from slider
        const xOffset = elOffset.left + $slide.offset().left;
        const yOffset = elOffset.top  + $slide.offset().top;

        // scaling difference
        const dpiDiff = settings.DPI_ZOOM - (settings.DPI_DEFAULT * this.s.currentWScale);

        // coordinate difference required on small slide to align with target on large slide
        const xDiff = Math.round((w * elX * dpiDiff) - (xOffset - (elOffset.left + $slideZoom.offset().left)));
        const yDiff = Math.round((h * elY * dpiDiff) - (yOffset - (elOffset.top  + $slideZoom.offset().top )));

        const {needsScrollbar} = this.checkScrollbars({width:$slide.width(), height:$slide.height()});

        this.availWidth  = this.width  - (needsScrollbar.y ? this.s.scrollbarWidth : 0);
        this.availHeight = this.height - (needsScrollbar.x ? this.s.scrollbarWidth : 0);

        // extra space available within view
        const xMargin = this.availWidth  - $slide.width();
        const yMargin = this.availHeight - $slide.height();

        // extra space available within slider
        const xMarginLeft = xOffset + xDiff - xScroll;
        const yMarginTop  = yOffset + yDiff - yScroll;

        const xMarginRight  = xScroll + this.availWidth  - (xOffset + xDiff + $slide.width());
        const yMarginBottom = yScroll + this.availHeight - (yOffset + yDiff + $slide.height());

        const xScrollAdj = (xMargin > 0
          ? xScroll - (xOffset + xDiff) + Math.max(xMargin / 2, 0)
          : Math.min(-xMarginLeft, 0) + Math.max(xMarginRight, 0) );
        const yScrollAdj = (yMargin > 0
          ? yScroll - (yOffset + yDiff) + Math.max(yMargin / 2, 0)
          : Math.min(-yMarginTop, 0) + Math.max(yMarginBottom, 0) );

        // position non-zoom frame in the desired relative location
        const xFrame = xDiff + xScrollAdj;
        const yFrame = yDiff + yScrollAdj;

        $frame.css({transform: `translate(${xFrame}px, ${yFrame}px)`});

        // find origin that will scale to final position
        const xPct = ((elOffset.left + $slide.offset().left) - (elOffset.left + $slideZoom.offset().left)) / ($slideZoom.width()  - $slide.width());
        const yPct = ((elOffset.top  + $slide.offset().top ) - (elOffset.top  + $slideZoom.offset().top )) / ($slideZoom.height() - $slide.height());

        const xOrigin = ((elOffset.left + $slideZoom.offset().left) + ($slideZoom.width()  * xPct)) / $frameZoom.width();
        const yOrigin = ((elOffset.top  + $slideZoom.offset().top ) + ($slideZoom.height() * yPct)) / $frameZoom.height();
        const scale   = settings.ZOOM_RATIO / this.s.currentWScale;

        $frameZoom.css({'z-index': 1});
        $frame.css({opacity: 0});
        $frameZoom.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});
        $rulers.addClass('no-transition').css({transform: `scale(${settings.ZOOM_RATIO})`});

        // ensure dom is updated before running zoom transition
        forceRepaint();
        this.noTransition = false;
        await this.$nextTick();

        $frameZoom.addClass('is-zooming').css({transform: `scale(${1 / scale})`});
        $rulers.removeClass('no-transition').css({transform: `scale(${this.s.currentWScale})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frameZoom.css({'z-index': ''});
        $frame.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const xScrollTo = -($frame.offset().left - $el.offset().left);
        const yScrollTo = -($frame.offset().top  - $el.offset().top);

        this.noTransition = true;
        await this.$nextTick();

        $frameZoom.css({opacity: 0, 'pointer-events': 'none'});
        $frameZoom.removeClass('is-zooming').css({transform: ''});
        $frame.css({transform: ''});
        $frameZoom.css({position: 'fixed'});
        this.autosize({resize:true});

        el.scrollLeft = xScrollTo;
        el.scrollTop  = yScrollTo;
      } // zoom out

      forceRepaint();
      this.noTransition = false;

      this.set({isZooming:false});

    }, // toggleDpi()

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

.slider-frame,
.slider-view {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
}

.slider-pane {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  @include short-transition;
  pointer-events: none;

  > * {
    pointer-events: all;
  }
}

// TODO:
.has-scrollbar-y .slider-pane {
  width: calc(100% - #{$scrollbar-width});
}
.has-scrollbar-x .slider-pane {
  height: calc(100% - #{$scrollbar-width});
}

//----------------------------------------------------------------------------------------------------------------------

.slider {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden; // changed from 'auto' to avoid secondary scrolling issues on zoom
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

  @at-root .no-transition & {
    transition: none;
  }

  &.zoom {
    display: none;
    position: fixed;
    pointer-events: none;
    opacity: 0;
    font-size: #{$zoom-ratio}em;
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

  @at-root .no-transition & {
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

  // TODO: specific to #the-samples
  // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
  // [2018-07] svg cursor only works in Chrome and Firefox
  @at-root .has-zoom[data-dpi="80"] #the-samples .slider:not([aria-grabbed]) .slide.current,
  .has-zoom[data-dpi="80"] .rulers .target {
    cursor: zoom-in;
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='13' y1='8' x2='13' y2='18' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-in;
  }
  @at-root .has-zoom[data-dpi="120"] #the-samples .slider:not([aria-grabbed]) .slide.current,
  .has-zoom[data-dpi="120"] .rulers .target {
    cursor: zoom-out;
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-out;
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

  @at-root [data-dir="ltr"] &.non-sequential-after {
    margin-right: 5.5em;
  }
  @at-root [data-dir="rtl"] &.non-sequential-after {
    margin-left: 5.5em;
  }
  &.non-sequential-after::after {
    content: '\2022\2009\2022\2009\2022'; // three dots
    font-size: 3em;
    pointer-events: none;
    position: absolute;
    color: transparentize(darken($background-color, 95%), .5);
    @include short-transition;
    top: 50%;
    transform: translate(-50%, -50%);

    @at-root [data-dir="ltr"] & {
      left: calc(100% + 1em);
    }
    @at-root [data-dir="rtl"] & {
      right: calc(100% + 1em);
      transform: translate(50%, -50%);
    }
  }
  &.non-sequential-after.current::after {
    opacity: .25; // match opacity of :not(.current) slides to maintain constant color tone
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

    // TODO specific to #the-samples
    @at-root #the-samples &::after {
      pointer-events: none;
      @include absolute-center(x);
      content: 'COPYRIGHTED MATERIAL';
      white-space: nowrap;
      bottom: .5em;
      color: darken($alert-color, 25%);
      text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
    }
    // ^^^
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
      margin-top: 0.25em;
      height: 4em;
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
