<template>
  <article :class="['slider',sliderClass]" :aria-grabbed="isGrabbing">

    <div class="frame-masks">
      <div v-for="cls of ['side above','side below']" :class="`frame-mask ${cls}`"></div>
    </div>

    <div class="frame dpi80">
      <div class="slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                 :class="`slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 80)">
          <div class="slide-liner">
            <img v-if="sample.image" data-dpi="80" :style="imageStyleSize(sample, 80)" :data-src="imageSrc(sample, 80)" :data-error="imageError(sample, 80)" draggable="false"
                 @load="onImageLoaded(sample.index, 80, $event)" @error="onImageLoadError(sample.index, 80)" />
            <h1 v-else class="sample-title">{{sample.title ? sample.title : `(${sample.id})` }}</h1>
          </div>
        </section>
      </div>
    </div>

    <div v-if="s.hasZoom" class="frame dpi120">
      <div class="slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                 :class="`slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 120)">
          <div class="slide-liner">
            <img data-dpi="120" :style="imageStyleSize(sample, 120)" :data-src="imageSrc(sample, 120)" :data-error="imageError(sample, 120)" draggable="false"
                 @load="onImageLoaded(sample.index, 120, $event)" @error="onImageLoadError(sample.index, 120)" />
          </div>
        </section>
      </div>
    </div>

    <aside :class="`sidebar prev v ${isFirst ? 'disabled' : ''}`">
      <nuxt-link class="btn btn-slider prev ltr" :tabindex="0" :to="'#' + getSample(-1, 'id')" replace aria-label="previous sample" tag="button">
        <SvgIcon view="24 48" :d="btnSliderPath"></SvgIcon>
      </nuxt-link>
    </aside>
    <aside :class="`sidebar next v ${isLast ? 'disabled' : ''}`">
      <nuxt-link class="btn btn-slider next ltr" :tabindex="0" :to="'#' + getSample(+1, 'id')" replace aria-label="next sample" tag="button">
        <SvgIcon view="24 48" :d="btnSliderPath"></SvgIcon>
      </nuxt-link>
    </aside>

  </article>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import settings from '~/assets/settings';

import sleep from '~/plugins/sleep';
import supports3d from '~/plugins/supports3d';
import supportsPassive from '~/plugins/supportsPassive';

import { mapGetters, mapMutations } from 'vuex';

// jQuery-style custom function
//*
window.$.fn.offsetRect = function() {
  return this[0].getBoundingClientRect();
};
//*/

export default {
  components: {
    SvgIcon,
  },

  props: {
    samples: Array,
    currentIndex: Number,
  },

  data () {
    return {
      isInit:       false,
      isGrabbing:   false,
      isScrolling:  null,
      noTransition: true,
      windowWidth:  window.innerWidth,
      availWidth:   document.documentElement.clientWidth,
      availHeight:  document.documentElement.clientHeight,
      slideHeight:  null,
      slideWidth:   null,
      groupHeight:  null,
      touchPoint:   null,
      supports3d:   supports3d(),
      eTouchParams: supportsPassive() ? { passive: true } : false,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters([
      'getSample',
      'imageSrc',
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

    sliderClass() {
      return {
        'is-init':  this.isInit,
        'no-transition': this.noTransition,
        'has-prev': !this.isFirst,
        'has-next': !this.isLast,
      }
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
    window.addEventListener('resize', this.onResize);
    this.$el.addEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.addEventListener('mousedown',  this.onTouchstart);
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
      this.forceRepaint();
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initImages();
      this.isInit = true;
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    imageStyleSize(sample, dpi) {
      const x = dpi * (dpi === settings.DPI_DEFAULT ? (sample.image.wScale || 1) : 1);
      return {
        width:  `${Math.ceil(sample.image.w * x)}px`,
        height: `${Math.ceil(sample.image.h * x)}px`,
      };
    }, // imageStyleSize()

    //------------------------------------------------------------------------------------------------------------------

    initImages() {

      for (const dpi of [80, 120]) {
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

        let images = this.$el.querySelectorAll(`.frame.dpi${dpi} [data-src]`);

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

    onImageLoaded(i, dpi, event) {
      this.$store.commit('setImageLoaded', {i, dpi});

      // use 80-dpi image as scaled background until 120-dpi image loads
      if (dpi === settings.DPI_DEFAULT && !this.s.samples[i].image.loaded[settings.DPI_ZOOM]) {
        this.$el.querySelector(`.frame.dpi120 [data-index="${i}"] img`).style.backgroundImage = `url("${event.target.src}")`;
      }
      // use 120-dpi image to avoid unnecessary downloads
      if (dpi === settings.DPI_ZOOM && !this.s.samples[i].image.loaded[settings.DPI_DEFAULT]) {
        this.$el.querySelector(`.frame.dpi80 [data-index="${i}"] img`).src = event.target.src;
      }
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoadError(i, dpi) {
      this.$store.commit('setImageLoaded', {i, dpi, loaded:false});
      this.$el.querySelector(`.frame.dpi${dpi} [data-index="${i}"] img`).removeAttribute('src');
    }, // onImageLoadError()

    //------------------------------------------------------------------------------------------------------------------

    onResize() {
      this.windowWidth = window.innerWidth;
      this.availWidth  = document.documentElement.clientWidth;
      this.availHeight = document.documentElement.clientHeight;

      // delay autosize() until above settings are propagated in layout

      clearTimeout(window._resizeT);

      window._resizeT = setTimeout(async () => {
        this.autosize({resize:true});
      }, settings.TRANSITION_TIME_MS);

    }, // onResize()

    //------------------------------------------------------------------------------------------------------------------

    autosize({dpi = null, resize = false} = {}) {
      const index = this.currentIndex;

      if (!dpi) dpi = this.s.dpi;

      // the IntersectionObserver [see initImages()] will lazy-load images in the sequence of crossing the threshold
      // the following ensures the current image loads first, which is useful when scrolling past many slides via the nav list
      if (this.s.samples[this.currentIndex].image) {
        this.preloadImage(this.$el.querySelector(`.frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"] img`));
      }

      const $slider = window.$(this.$el);
      const $frame  = $slider.find(`.frame.dpi${dpi}`);
      const $slides = $frame.find('.slides');
      const $slide  = $slides.find(`.slide[data-index="${index}"]`);

      const height = Math.ceil($slide.height());
      const width  = Math.ceil($slide.width());

      const $slidePrev = $slide.prev();
      const $slideNext = $slide.next();

      // scrollbars can sometimes be present that won't actually be needed for the actual slide size
      const {needsScrollbar} = this.checkScrollbars({width, height});

      this.availWidth  = window.innerWidth  - (needsScrollbar.y ? this.s.scrollbarWidth : 0);
      this.availHeight = window.innerHeight - (needsScrollbar.x ? this.s.scrollbarWidth : 0);

      const frameHeight = Math.ceil(Math.max(height, this.availHeight));
      const frameWidth  = Math.ceil(Math.max(width,  this.availWidth));

      // this determines how much gutter space is masked from being grabbable for sliding
      const groupHeight = Math.max(height, $slidePrev.length ? $slidePrev.height() : 0, $slideNext.length ? $slideNext.height() : 0);

      if (resize || height !== this.slideHeight || width !== this.slideWidth || groupHeight !== this.groupHeight) {

        this.slideHeight = height;
        this.slideWidth  = width;
        this.groupHeight = groupHeight;

        const xMargin = Math.max(this.availWidth - width, 0) / 2;
        const yMargin = Math.max(this.availHeight - groupHeight, 0) / 2;

        if (dpi === this.s.dpi) {
          $slider.css({
            width:  `${frameWidth}px`,
            height: `${frameHeight}px`,
          });
          window.$(this.$el).find('.frame-mask.end').css({width: `${xMargin}px`});
          window.$(this.$el).find('.frame-mask.side').css({height: `${yMargin}px`});
        }

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

      if (this.noTransition) this.forceRepaint();
    }, // autosize()

    //------------------------------------------------------------------------------------------------------------------

    checkScrollbars({width, height}) {
      const hasScrollbarX = this.availHeight < window.innerHeight;
      const hasScrollbarY = this.availWidth  < window.innerWidth;
      const needsScrollbarX = width  > window.innerWidth  || (width  > this.availWidth  && height > window.innerHeight);
      const needsScrollbarY = height > window.innerHeight || (height > this.availHeight && width  > window.innerWidth);

      this.set({
        hasScrollbarX: needsScrollbarX,
        hasScrollbarY: needsScrollbarY,
      });

      return {
        hasScrollbar: {x:hasScrollbarX, y:hasScrollbarY},
        needsScrollbar: {x:needsScrollbarX, y:needsScrollbarY},
      };
    }, // checkScrollbars()

    //------------------------------------------------------------------------------------------------------------------

    sampleStyleSize(sample, dpi) {
      const xdpi = sample.image ? dpi : 1;
      // TODO: taking the width from the clientHeight can cause weird alignment issues on resizing
      let w = sample.image ? Math.ceil(sample.image.w * xdpi) : Math.min(window.innerWidth, document.documentElement.clientHeight);
      let h = sample.image ? Math.ceil(sample.image.h * xdpi) : null;

      if (sample.audio) h += 40; // add some vertical padding so sheet music won't be obscured by controls

      // at default zoom, contain slide within view
      if (dpi === settings.DPI_DEFAULT) {
        let wScale = 1;

        if (w > this.windowWidth) {
          // if zoomed in, default slides should not count h scrollbar
          const windowHRatio = (this.s.dpi !== settings.DPI_DEFAULT || this.s.isZooming ? window.innerHeight : document.documentElement.clientHeight) / this.windowWidth;
          const slideHRatio = h / w;

          wScale = (this.windowWidth - (slideHRatio > windowHRatio ? this.s.scrollbarWidth : 0)) / w;

          // if in the gap between toggling v scrollbar, expand to contain
          if (w * wScale < this.windowWidth && h * wScale < window.innerHeight) {
            wScale = Math.min(this.windowWidth / w, window.innerHeight / h);
          }

          w = Math.round(w * wScale);
          h = Math.floor(h * wScale);
        }

        if (sample.image) this.$store.commit('setSampleImageWScale', {i:sample.index, wScale});

        if (sample.index === this.s.currentIndex) this.set({currentWScale: wScale});
      }

      const width    = `${w}px`;
      const height   = sample.image ? `${h}px` : '';
      const maxWidth = sample.image ? '' : '650px'; // sheet music width

      return {width, height, maxWidth};
    }, // sampleStyleSize()

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
        // [2018-09-12] ensure 'no-transition' class is removed in Firefox; this.forceRepaint() doesn't seem to do the trick
        this.$nextTick(() => {
          this.autosize();
        });
      }
    }, // onTouchend()

    //------------------------------------------------------------------------------------------------------------------

    getSlideOffset($slide) {
      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      const $slides = $slide.closest('.slides');
      const height = Math.ceil($slide.height());
      const frameHeight = Math.ceil(Math.max(height, this.availHeight));

      const xOffset = $slide.offsetRect()[metric] - $slides.offsetRect()[metric];
      let yOffset = Math.floor(($slides.height() - frameHeight) / 2);

      // [2018-07] IE11 (Trident) still has 5% usage and does not support flexbox (so slides are not vertically centered)
      if (navigator.userAgent.match(/Trident/) && yOffset > 0) yOffset *= -1;

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

      const $el        = window.$('.the-item');
      const el         = $el[0];
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
        const xOffset = $slide.offsetRect()[metric];
        const yOffset = Math.max($slide.offset().top, 0);
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
        $rulers.css({transform: `scale(${1 / scale})`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        this.noTransition = false;
        await this.$nextTick();

        $frame.addClass('is-zooming').css({transform: `translate(${xFrame}px, ${yFrame}px) scale(${scale})`});
        $rulers.css({transform: ''});

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
        const xOffset = el.scrollLeft + $slide.offset().left;
        const yOffset = el.scrollTop  + $slide.offset().top;
        const dpiDiff = settings.DPI_ZOOM - (settings.DPI_DEFAULT * this.s.currentWScale);

        const xDiff = Math.round((w * elX * dpiDiff) - (xOffset - (el.scrollLeft + $slideZoom.offset().left)));
        const yDiff = Math.round((h * elY * dpiDiff) - (yOffset - (el.scrollTop  + $slideZoom.offset().top)));

        const {needsScrollbar} = this.checkScrollbars({width:$slide.width(), height:$slide.height()});

        this.availWidth  = window.innerWidth  - (needsScrollbar.y ? this.s.scrollbarWidth : 0);
        this.availHeight = window.innerHeight - (needsScrollbar.x ? this.s.scrollbarWidth : 0);

        const xMargin = this.availWidth  - $slide.width();
        const yMargin = this.availHeight - $slide.height();

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
        const xPct = ((el.scrollLeft + $slide.offset().left) - (el.scrollLeft + $slideZoom.offset().left)) / ($slideZoom.width()  - $slide.width());
        const yPct = ((el.scrollTop  + $slide.offset().top)  - (el.scrollTop  + $slideZoom.offset().top))  / ($slideZoom.height() - $slide.height());

        const xOrigin = ((el.scrollLeft + $slideZoom.offset().left) + ($slideZoom.width()  * xPct)) / $frameZoom.width();
        const yOrigin = ((el.scrollTop  + $slideZoom.offset().top)  + ($slideZoom.height() * yPct)) / $frameZoom.height();
        const scale   = settings.ZOOM_RATIO / this.s.currentWScale;

        $frameZoom.css({'z-index': 1});
        $frame.css({opacity: 0});
        $frameZoom.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});
        $rulers.css({transform: `scale(${settings.ZOOM_RATIO})`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        this.noTransition = false;
        await this.$nextTick();

        $frameZoom.addClass('is-zooming').css({transform: `scale(${1 / scale})`});
        $rulers.css({transform: `scale(${this.s.currentWScale})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frameZoom.css({'z-index': ''});
        $frame.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const xScrollTo = -$frame.offset().left;
        const yScrollTo = -$frame.offset().top;

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

      this.forceRepaint();
      this.noTransition = false;

      this.set({isZooming:false});

    }, // toggleDpi()

    //------------------------------------------------------------------------------------------------------------------
    // see <https://gist.github.com/paulirish/5d52fb081b3570c81e3a>

    forceRepaint($el = null) {
      ($el || window.$('body')).offset();
    }, // forceRepaint()

    //------------------------------------------------------------------------------------------------------------------

    getTransformOrigin($frame, $frameZoom) {

      const xOriginAdj = 0;

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
@import "../assets/slider.scss";

//TODO: go
$frame-ruler-inch: 80px;
$frame-ruler-width-half: ($frame-ruler-width-nominal - 1) / 2;

$layer-frame-mask: 2; // above both <.frame>s to mask grab zones
//$layer-frame-rulers: $layer-frame-mask + 1;

$radius-lg: $radius * 2;

.slider {
  /*
  position: absolute;
  overflow: hidden;
  display: flex;
  justify-content: center;
  @include short-transition;

  &.no-transition {
    transition: none;
  }

  .frame-mask {
    position: fixed;
    z-index: $layer-frame-mask;

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
    .slider.has-next .frame-mask.next,
    [aria-grabbed] .frame-mask {
      display: none;
    }
  } // .frame-mask
  //*/

  .frame {
    /*
      position: absolute;
      box-sizing: border-box;
      overflow: hidden;
      white-space: nowrap;
      @include short-transition;

      @at-root
      .no-transition#{&} {
        transition: none;
      }
    //*/

    &.dpi120 {
      display: none;
      position: fixed;
      pointer-events: none;
      opacity: 0;
      font-size: #{$zoom-ratio}em;
    }
  } // .frame

  /*
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
  }
  //*/

  .slide {
    /*
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
    //*/

    // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
    // [2018-07] svg cursor only works in Chrome and Firefox
    @at-root .has-zoom[data-dpi="80"] .the-item .slider:not([aria-grabbed]) .slide.current,
    .has-zoom[data-dpi="80"] .rulers .target {
      cursor: zoom-in;
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='13' y1='8' x2='13' y2='18' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-in;
    }
    @at-root .has-zoom[data-dpi="120"] .the-item .slider:not([aria-grabbed]) .slide.current,
    .has-zoom[data-dpi="120"] .rulers .target {
      cursor: zoom-out;
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-out;
    }
    /*
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
    //*/

    // TODO style slide height
    @include below-sheet-music-min {
      @at-root .the-item & {
        height: calc(100vh - 10em);
      }
    }

    /*
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
    //*/

    @at-root [data-dir="ltr"] &.non-sequential-after {
      margin-right: 5.5em;
    }
    @at-root [data-dir="rtl"] &.non-sequential-after {
      margin-left: 5.5em;
    }
    &.non-sequential-after::after {
      content: '\2022\2009\2022\2009\2022';
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

    .slide-liner {
      /*
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      height: 100%;
      overflow: hidden;
      //*/

      @at-root .the-item &::after {
        pointer-events: none;
        @include absolute-center(x);
        content: 'COPYRIGHTED MATERIAL';
        white-space: nowrap;
        bottom: .5em;
        color: darken($alert-color, 25%);
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
      }
    }

    /*
    img {
      // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cstyle type='text/css'%3E .c1, .c2 %7B transform-origin: 100px 100px; animation: x 2s ease-out infinite; %7D .c2 %7B animation-delay:-1s; %7D @keyframes x %7B from %7B transform: scale%280%29; opacity:.5; %7D to %7B transform:scale%281.0%29; opacity:0; %7D %7D %3C/style%3E%3Ccircle class='c1' cx='100' cy='100' r='20' fill='black' /%3E%3Ccircle class='c2' cx='100' cy='100' r='20' fill='black' /%3E%3C/svg%3E") no-repeat center / cover;

      &[data-error] {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='-100 -100 400 400'%3E%3Cstyle type='text/css'%3E .sad %3E * %7B transform-origin: 100px 100px; animation: sad 1s ease-in forwards; %7D @keyframes sad %7B from %7B opacity: 0; transform: scale(0); %7D to %7B opacity: 1; %7D %7D .face %3E * %7B opacity: .25; %7D .teardrop %7B transform-origin: 15px 3px; opacity: .25; animation-delay: -1s; animation: t 5s ease-out infinite; %7D @keyframes t %7B from, 40%25 %7B transform: translate(94px, 95px) scale(0); %7D 95%25 %7B transform: translate(94px, 95px) scale(.15); %7D to %7B transform: translate(94px, 140px) scale(.15); %7D %7D text %7B fill: red; font-family: Arial, Helvetica, sans-serif; font-size: 10px; text-anchor: middle; %7D %3C/style%3E%3Cg class='sad'%3E%3Cg class='face'%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='black' stroke-width='4' /%3E%3Ccircle cx='94' cy='95' r='3' fill='black' /%3E%3Ccircle cx='106' cy='95' r='3' fill='black' /%3E%3Cpath d='M 90,109 a 12 12 0 0 1 20,0' stroke='black' stroke-width='2' stroke-linecap='round' fill='none' /%3E%3C/g%3E%3Cpath class='teardrop' fill='black' d='M15 3 Q16.5 6.8 25 18 A12.8 12.8 0 1 1 5 18 Q13.5 6.8 15 3z' /%3E%3Ctext x='100' y='150'%3Eimage failed to load%3C/text%3E%3C/g%3E%3C/svg%3E");
      }
    }
    //*/

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
        // icon sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M0,6 v6 h4 l5,5 v-16 l-5,5 h-4 z' /%3E%3Cpath d='M13.5,9 c0,-1.8 -1,-3.3 -2.5,-4 v8 c1.5,-0.7 2.5,-2.2 2.5,-4 z' /%3E%3Cpath d='M11,.2 v2 c3,1 5,3.6 5,6.8 s-2,5.8 -5,6.7 v2 c4,-0.8 7,-4.4 7,-8.7 s-3,-8 -7,-8.8 z' /%3E%3C/svg%3E") no-repeat center;
        opacity: .05;
      }
    }

  } // .slide

  /*
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
  //*/

} // .slider

</style>
