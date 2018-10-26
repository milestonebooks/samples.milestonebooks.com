<template>
  <article :class="['slider',sliderClass]" :aria-grabbed="isGrabbing" :data-debug="debug">

    <div class="frame-masks">
      <div v-for="cls of ['side above','side below']" :class="`frame-mask ${cls}`"></div>
    </div>

    <transition name="rulers">
      <div :class="`frame-rulers ${isUseTouch ? 'touch' : ''}`" v-show="s.showRulers">
        <div v-for="cls of ['x right','y top','x left r','y bottom r']" :class="`frame-ruler ${cls}`"><b v-for="i of 20"></b><div class="target"></div></div> <!-- 20 * 80px = (monitors up to 1600px) -->
      </div>
    </transition>

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
window.$.fn.offsetRect = function() {
  return this[0].getBoundingClientRect();
};

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
      debug:        null,
      isInit:       false,
      isGrabbing:   false,
      isScrolling:  null,
      noTransition: true,
      dpiImages:    settings.DPI_DEFAULT,
      windowWidth:  window.innerWidth,
      availWidth:   document.documentElement.clientWidth,
      availHeight:  document.documentElement.clientHeight,
      slideHeight:  null,
      slideWidth:   null,
      groupHeight:  null,
      touchPoint:   null,
      supports3d:   supports3d(),
      isUseTouch:   false,
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

    's.showRulers'() { this.toggleRulers() },

    's.currentWScale'() { this.scaleRulers() },

  },

  //====================================================================================================================

  mounted() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.scaleRulers); // needs because Safari scales image without scaling rulers
    this.$el.addEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.addEventListener('mousedown',  this.onTouchstart);
    if (this.s.showRulers) {
      this.scaleRulers();
      this.toggleRulers();
    }
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

    update() {
      //if (process.env.NODE_ENV !== 'production') console.log(`TheSlider update() ${this.currentIndex} @ ${this.s.dpi}`);
      this.autosize();
      if (!this.isInit) this.init();
      this.$nextTick(() => {
        this.forceRepaint();
      });
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
          // root: use viewport instead of <div.frame> Chrome uses element net margin (negative margins are subtracted) for boundary instead of width/height like Firefox
          //root: window.$(`.the-item .frame.dpi${dpi}`)[0],
          rootMargin: '100px',
        });

        let images = document.querySelectorAll(`.slider .frame.dpi${dpi} [data-src]`);

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
        window.$(`.the-item .frame.dpi120 [data-index="${i}"] img`).css({'background-image': `url("${event.target.src}")`});
      }
      // use 120-dpi image to avoid unnecessary downloads
      if (dpi === settings.DPI_ZOOM && !this.s.samples[i].image.loaded[settings.DPI_DEFAULT]) {
        window.$(`.the-item .frame.dpi80 [data-index="${i}"] img`)[0].src = event.target.src;
      }
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoadError(i, dpi) {
      this.$store.commit('setImageLoaded', {i, dpi, loaded:false});
      window.$(`.the-item .frame.dpi${dpi} [data-index="${i}"] img`)[0].removeAttribute('src');
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
        this.preloadImage(window.$(`.the-item .frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"] img`)[0]);
      }

      const $slider = window.$('.the-item .slider');
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

        //console.log(`autosize(${dpi}) frameWidth[${frameWidth}]`);

        if (dpi === this.s.dpi) {
          $slider.css({
            width:  `${frameWidth}px`,
            height: `${frameHeight}px`,
          });
          window.$('.the-item .frame-mask.end').css({width: `${xMargin}px`});
          window.$('.the-item .frame-mask.side').css({height: `${yMargin}px`});
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

      return {
        hasScrollbar: {x:hasScrollbarX, y:hasScrollbarY},
        needsScrollbar: {x:needsScrollbarX, y:needsScrollbarY},
      };
    }, // checkScrollbars()

    //------------------------------------------------------------------------------------------------------------------

    sampleStyleSize(sample, dpi) {
      const xdpi = sample.image ? dpi : 1;
      // TODO: taking the width from the clientHeight can cause weird alignment issues on resizing
      let w = sample.image ? Math.ceil(sample.image.w * xdpi) : Math.min(this.availWidth, document.documentElement.clientHeight);
      let h = sample.image ? Math.ceil(sample.image.h * xdpi) : null;

      if (sample.audio) h += 40; // add some vertical padding so sheet music won't be obscured by controls

      // at default zoom, contain slide within view
      if (dpi === settings.DPI_DEFAULT) {
        let wScale = 1;

        if (w > this.windowWidth) {
          // if zoomed in, default slides should not count h scrollbar
          const windowHRatio = (this.s.dpi !== settings.DPI_DEFAULT || this.s.isZooming ?  window.innerHeight : document.documentElement.clientHeight) / this.windowWidth;
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

      this.debug = (e.touches && e.touches.length ? `${window.$('[name="viewport"]').attr('content')}@${e.touches.length}` : null);
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
        window.$('.the-item .slider').addClass('no-transition'); // TODO

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
      this.debug = (e.touches && e.touches.length ? e.touches.length : null);
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

      window.$('.the-item .slider').removeClass('no-transition');

      // decide what the interaction means
      let action = 'click';
      const duration = Date.now() - this.touchPoint.time;
      const diffX = Math.abs(this.touchPoint.deltaX);
      const diffY = Math.abs(this.touchPoint.deltaY);
      const dir = (this.touchPoint.deltaX < 0 ? 'left' : 'right');

      const slideWidth = window.$(`.the-item .frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"]`).width();

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

    toggleRulers() {
      const $rulers = window.$('.frame-rulers');

      if (this.s.showRulers) {
        $rulers[0].addEventListener('touchstart', this.onRulersTouchstart);
        window.addEventListener('mousemove', this.positionRulers);

        //this.$store.dispatch('alert', {msg:'drag rulers to measure in inches'});
      } else {
        $rulers[0].removeEventListener('touchstart', this.onRulersTouchstart);
        window.removeEventListener('mousemove', this.positionRulers);

        $rulers.css({
          left: '',
          top:  '',
        });
      }

    }, // toggleRulers()

    //------------------------------------------------------------------------------------------------------------------

    positionRulers(event, {touch = false} = {}) {
      const {clientX:x, clientY:y} = event;

      // screen out touch taps, which trigger 'mousemove' events with no movement
      if (event.movementX !== undefined && event.movementX + event.movementY === 0) return false;

      if (!touch) this.isUseTouch = false;

      if (window.$(event.target).closest('.sidebar').length) return false;

      window.$('.frame-rulers').css({
        left: `${x}px`,
        top:  `${y}px`,
      });
    }, // positionRulers()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchstart(e) {
      const touches = e.touches ? e.touches[0] : e;

      this.noTransition = true;
      this.isUseTouch = true;

      const $rulers = window.$('.frame-rulers');

      $rulers[0].addEventListener('touchmove', this.onRulersTouchmove);
      $rulers[0].addEventListener('touchend',  this.onRulersTouchend);

      this.touchPoint = {
        $el: $rulers,
        rulerX: $rulers.offset().left,
        rulerY: $rulers.offset().top,
        x: touches.pageX,
        y: touches.pageY,
        deltaX: 0,
        deltaY: 0,
      };

      // avoid scrolling when moving rulers
      e.preventDefault();

    }, // onRulersTouchstart()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchmove(e) {
      const touches = e.touches ? e.touches[0] : e;

      this.touchPoint.deltaX = touches.pageX - this.touchPoint.x;
      this.touchPoint.deltaY = touches.pageY - this.touchPoint.y;

      let x = this.touchPoint.rulerX + this.touchPoint.deltaX - window.scrollX;
      let y = this.touchPoint.rulerY + this.touchPoint.deltaY - window.scrollY;
      const scale = settings.DPI_DEFAULT / this.s.currentWScale;

      const offset = ((settings.FRAME_RULER_WIDTH_NOMINAL * (this.s.dpi / scale)) - 1) / 2;

      // keep within view
      x = Math.min(Math.max(x, offset), this.availWidth  - offset);
      y = Math.min(Math.max(y, offset), this.availHeight - offset);

      this.positionRulers({
        clientX: x,
        clientY: y,
      }, {touch:true});

    }, // onRulersTouchmove()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchend() {
      // cleanup
      const $rulers = window.$('.frame-rulers');

      $rulers[0].removeEventListener('touchmove', this.onRulersTouchmove);
      $rulers[0].removeEventListener('touchend',  this.onRulersTouchend);

      this.noTransition = false;

    }, // onRulersTouchend()

    //------------------------------------------------------------------------------------------------------------------

    scaleRulers() {
      if (this.s.dpi === settings.DPI_DEFAULT) {
        window.$('.frame-rulers').css({
          transform: `scale(${this.s.currentWScale}`,
          width: `${200 / this.s.currentWScale}%`, // see .frame-rulers { width }
        }).find('.target').css({
          transform: `scaleY(${1 / this.s.currentWScale})`
        });
      }
    }, // scaleRulers()

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
      const $rulers    = $slider.find('.frame-rulers');

      // ensure no transitions are in effect to delay prep layout
      $slider.addClass('no-transition');

      const w = this.s.samples[index].image.w;
      const h = this.s.samples[index].image.h;

      const xScroll = window.scrollX;
      const yScroll = window.scrollY;

      // TODO: 'rtl' zoom-in is buggy
      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      if (zoomIn) {
        const xOffset = $slide.offsetRect()[metric];
        const yOffset = $slide.offset().top;
        const dpiDiff = settings.DPI_ZOOM - (settings.DPI_DEFAULT * this.s.currentWScale);

        const xDiff = Math.round((w * elX * dpiDiff) - xOffset);
        const yDiff = Math.round((h * elY * dpiDiff) - yOffset);

        const xScrollTo = xScroll + xDiff;
        const yScrollTo = yScroll + yDiff;

        // position the zoom slider to trigger layout and image loading
        $frameZoom.css({display: 'block', position: 'absolute'});
        this.autosize({resize:true});

        // position view to compensate for new layout
        // TODO: [2018-08-03] window.scroll doesn't seem to work on Chrome mobile (tested in desktop mobile mode and in Chrome for Android)
        window.scroll(xScrollTo, yScrollTo);

        // when non-zoom frame is contained within view, desired scroll position may not be possible
        const xScrollAdj = window.scrollX - xScrollTo;
        const yScrollAdj = window.scrollY - yScrollTo;

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
        $slider.removeClass('no-transition');
        $frame.addClass('is-zooming').css({transform: `translate(${xFrame}px, ${yFrame}px) scale(${scale})`});
        $rulers.css({transform: ''});

        // zoom
        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frame.css({'z-index': ''});
        $frameZoom.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        $slider.addClass('no-transition');
        $frame.css({opacity: 0, 'pointer-events': 'none'});
        $frame.removeClass('is-zooming').css({transform: ''});

        this.forceRepaint();
        $slider.removeClass('no-transition');

      // zoom out
      } else {
        const xOffset = $slide.offset().left;
        const yOffset = $slide.offset().top;
        const dpiDiff = settings.DPI_ZOOM - settings.DPI_DEFAULT;

        const xDiff = Math.round((w * elX * dpiDiff) - (xOffset - $slideZoom.offset().left));
        const yDiff = Math.round((h * elY * dpiDiff) - (yOffset - $slideZoom.offset().top));

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
        const xPct = ($slide.offset().left - $slideZoom.offset().left) / ($slideZoom.width()  - $slide.width());
        const yPct = ($slide.offset().top  - $slideZoom.offset().top)  / ($slideZoom.height() - $slide.height());

        const xOrigin = ($slideZoom.offset().left + ($slideZoom.width()  * xPct)) / $frameZoom.width();
        const yOrigin = ($slideZoom.offset().top  + ($slideZoom.height() * yPct)) / $frameZoom.height();
        const scale   = settings.ZOOM_RATIO / this.s.currentWScale;

        $frameZoom.css({'z-index': 1});
        $frame.css({opacity: 0});
        $frameZoom.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});
        $rulers.css({transform: `scale(${settings.ZOOM_RATIO})`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $slider.removeClass('no-transition');
        $frameZoom.addClass('is-zooming').css({transform: `scale(${1 / scale})`});
        $rulers.css({transform: `scale(${this.s.currentWScale})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frameZoom.css({'z-index': ''});
        $frame.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const xScrollTo = Math.max(window.scrollX - $frame.offset().left, 0);
        const yScrollTo = Math.max(window.scrollY - $frame.offset().top,  0);

        $slider.addClass('no-transition');
        $frameZoom.css({opacity: 0, 'pointer-events': 'none'});
        $frameZoom.removeClass('is-zooming').css({transform: ''});
        $frame.css({transform: ''});
        $frameZoom.css({position: 'fixed'});
        this.autosize({resize:true});
        window.scroll(xScrollTo, yScrollTo);

        this.forceRepaint();
        $slider.removeClass('no-transition');
      } // zoom out

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

$frame-ruler-inch: 80px;
$frame-ruler-width-half: ($frame-ruler-width-nominal - 1) / 2;

$layer-frame-mask: 2; // above both <.frame>s to mask grab zones
$layer-frame-rulers: $layer-frame-mask + 1;
$layer-buttons: $layer-frame-rulers + 1;

$radius-lg: $radius * 2;

.slider {
  position: absolute;
  //min-width: 100%;
  //min-height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  @include short-transition;

  //&.is-resizing,
  &.no-transition {
    transition: none;
  }

  //*
  &[data-debug]::before {
    content: attr(data-debug);
    z-index: 9;
    position: fixed;
    top: 4rem;
    right: 0;
    font-size: 2em;
    outline: 1px solid red;
    background: hsla(0,100%,100%,.75);
  }
  //*/

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

  .frame-rulers {
    z-index: $layer-frame-rulers;
    pointer-events: none;
    opacity: .75;
    position: fixed;
    left: calc(100% - (1em + (#{$unit} / 2)));
    top:  1em + ($unit / 2);
    width: 200%; // rulers are rotated by transform so no height is necessary, but width should be at least double to accommodate aspect ratios up to 2:1 (only edge cases beyond 16:9)
    transform-origin: 0 0;

    &.rulers-leave-active,
    .show-rulers &.rulers-enter-active {
      @include short-transition;
    }

    transition: transform $transition-time-ms ease-in-out; // used for zooming
    @at-root .no-transition#{&} { // applied while dragging
      transition: none;
    }

    /* [2018-08-03] TODO: change to a hideable Tip component
    @at-root .show-rulers:not(.has-mouse) &::before {
      content: '';
      position: absolute;
      top: 4em;
      font-size: 1.5em;
      left: 0;
      transform-origin: left center;
      transform: translateX(2em);
      border-top: 1.5em solid transparent;
      border-right: 1.5em solid white;
      border-bottom: 1.5em solid transparent;
      transition: opacity 1s ease-out 2s, transform 2s cubic-bezier(.5,-2,.5,1);
      @at-root .show-rulers .frame-rulers:not(.rulers-enter-active)::before {
        opacity: 0;
        transform: translateX(1em);
      }
    }
    @at-root .show-rulers:not(.has-mouse) &::after {
      content: 'drag ruler to measure inches';
      position: absolute;
      top: 4em;
      font-size: 1.5em;
      transform-origin: left center;
      transform: translateX(3.5em);
      height: 3em;
      line-height: 2.6;
      background-color: white;
      padding-right: 1em;
      border-radius: 0 1.5em 1.5em 0;
      transition: opacity 1s ease-out 2s, transform 2s cubic-bezier(.5,-2,.5,1);
      @at-root .show-rulers .frame-rulers:not(.rulers-enter-active)::after {
        opacity: 0;
        transform: translateX(2.5em);
      }
    }
    //*/
  }

  .frame-ruler {
    position: absolute;
    left: $frame-ruler-width-half;
    top: -$frame-ruler-width-half;
    height: $frame-ruler-width-nominal - 1;
    background-color: hsl(60, 100%, 50%);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='#{$frame-ruler-inch}' height='#{$frame-ruler-width-nominal - 1}' viewBox='0 0 #{$frame-ruler-inch} #{$frame-ruler-width-nominal - 1}'%3E%3Cpath d='M0,16 l 80,0 M10,12 l 0,7 M20,9 l 0,13 M30,12 l 0,7 M40,6 l 0,19 M50,12 l 0,7 M60,9 l 0,13 M70,12 l 0,7 M80,0 l 0,31' stroke='black' shape-rendering='crispEdges' /%3E%3C/svg%3E");
    counter-reset: inches;
    transform-origin: -#{$frame-ruler-width-half} #{$frame-ruler-width-half};
    transition: width $transition-time-ms ease-in-out;

    @at-root [data-dpi="120"] & {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='#{$frame-ruler-inch * $zoom-ratio}' height='#{$frame-ruler-width-nominal * $zoom-ratio - 1}' viewBox='0 0 #{$frame-ruler-inch * $zoom-ratio} #{$frame-ruler-width-nominal * $zoom-ratio - 1}'%3E%3Cpath d='M0,24 l 120,0 M15,19 l 0,9 M30,14 l 0,19 M45,19 l 0,9 M60,10 l 0,29 M75,19 l 0,9 M90,14 l 0,19 M105,19 l 0,9 M119.9,0 l 0,47' stroke='black' shape-rendering='crispEdges' /%3E%3C/svg%3E");
      left:  ($frame-ruler-width-nominal * $zoom-ratio - 1) / 2;
      top:  -($frame-ruler-width-nominal * $zoom-ratio - 1) / 2;
      height: $frame-ruler-width-nominal * $zoom-ratio - 1;
      transform-origin: -#{($frame-ruler-width-nominal * $zoom-ratio - 1) / 2} #{($frame-ruler-width-nominal * $zoom-ratio - 1) / 2};
    }
    width: 0;
    @at-root .show-rulers & {
      width: 100% !important;
      pointer-events: all;
    }
    overflow: hidden;
    @at-root .show-rulers .frame-rulers:not(.rulers-enter-active):not(.rulers-leave-active) .frame-ruler {
      overflow: visible;
    }

    // used to make touch target physically consistent when ruler size is scaled down
    .target {
      height: 100%;
      transform: scaleY(1);

      // make ruler cross-axis hole targetable for dragging (this prevents tap-to-zoom within the hole)
      @at-root .frame-rulers.touch .target::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        left: -50%;
      }
    }

    b {
      float: left;
      margin-bottom: 200%; // when overflow:hidden is not used on .frame-ruler, margin ensures any wrapped elements are offscreen
      position: relative;
      width: $frame-ruler-inch;
      height: $frame-ruler-width-nominal - 1;
      @at-root [data-dpi="120"] & {
        width: $frame-ruler-inch * $zoom-ratio;
        height: $frame-ruler-width-nominal * $zoom-ratio - 1;
      }

      &::after {
        counter-increment: inches;
        content: counter(inches);
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translate(-50%, -50%) translate(-0.5px, 0); // sequential because IE11 doesn't support calc() here
        @at-root .frame-ruler.r b::after {
          transform: translate(-50%, -50%) translate(0.5px, 0) rotate(180deg); // sequential because IE11 doesn't support calc() here
        }
        font: 900 16px Arial, Helvetica, sans-serif;
        background: hsl(60, 100%, 50%);
        line-height: 12px;
        padding: 2px;
        @at-root [data-dpi="120"] & {
          font-size: 24px;
          line-height: 18px;
          padding: 3px;
        }
      }
    }
  } // .frame-ruler
  .frame-ruler.y.top {
    transform: rotate(-90deg);
  }
  .frame-ruler.x.left {
    transform: rotate(-180deg);
  }
  .frame-ruler.y.bottom {
    transform: rotate(-270deg);
  }

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

    &.dpi120 {
      display: none;
      position: fixed;
      pointer-events: none;
      opacity: 0;
      font-size: #{$zoom-ratio}em;
    }
  } // .frame

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

    // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
    // [2018-07] svg cursor only works in Chrome and Firefox
    @at-root .has-zoom[data-dpi="80"] .the-item .slider:not([aria-grabbed]) .slide.current,
    .has-zoom[data-dpi="80"] .frame-rulers .target {
      cursor: zoom-in;
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='13' y1='8' x2='13' y2='18' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-in;
    }
    @at-root .has-zoom[data-dpi="120"] .the-item .slider:not([aria-grabbed]) .slide.current,
    .has-zoom[data-dpi="120"] .frame-rulers .target {
      cursor: zoom-out;
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-out;
    }
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

    // TODO style slide height
    @include below-sheet-music-min {
      @at-root .the-item & {
        height: calc(100vh - 10em);
      }
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
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      height: 100%;
      overflow: hidden;

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

    img {
      // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
      background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cstyle type='text/css'%3E .c1, .c2 %7B transform-origin: 100px 100px; animation: x 2s ease-out infinite; %7D .c2 %7B animation-delay:-1s; %7D @keyframes x %7B from %7B transform: scale%280%29; opacity:.5; %7D to %7B transform:scale%281.0%29; opacity:0; %7D %7D %3C/style%3E%3Ccircle class='c1' cx='100' cy='100' r='20' fill='black' /%3E%3Ccircle class='c2' cx='100' cy='100' r='20' fill='black' /%3E%3C/svg%3E") no-repeat center / cover;

      &[data-error] {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='-100 -100 400 400'%3E%3Cstyle type='text/css'%3E .sad %3E * %7B transform-origin: 100px 100px; animation: sad 1s ease-in forwards; %7D @keyframes sad %7B from %7B opacity: 0; transform: scale(0); %7D to %7B opacity: 1; %7D %7D .face %3E * %7B opacity: .25; %7D .teardrop %7B transform-origin: 15px 3px; opacity: .25; animation-delay: -1s; animation: t 5s ease-out infinite; %7D @keyframes t %7B from, 40%25 %7B transform: translate(94px, 95px) scale(0); %7D 95%25 %7B transform: translate(94px, 95px) scale(.15); %7D to %7B transform: translate(94px, 140px) scale(.15); %7D %7D text %7B fill: red; font-family: Arial, Helvetica, sans-serif; font-size: 10px; text-anchor: middle; %7D %3C/style%3E%3Cg class='sad'%3E%3Cg class='face'%3E%3Ccircle cx='100' cy='100' r='20' fill='none' stroke='black' stroke-width='4' /%3E%3Ccircle cx='94' cy='95' r='3' fill='black' /%3E%3Ccircle cx='106' cy='95' r='3' fill='black' /%3E%3Cpath d='M 90,109 a 12 12 0 0 1 20,0' stroke='black' stroke-width='2' stroke-linecap='round' fill='none' /%3E%3C/g%3E%3Cpath class='teardrop' fill='black' d='M15 3 Q16.5 6.8 25 18 A12.8 12.8 0 1 1 5 18 Q13.5 6.8 15 3z' /%3E%3Ctext x='100' y='150'%3Eimage failed to load%3C/text%3E%3C/g%3E%3C/svg%3E");
      }
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
        // icon sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 18 18'%3E%3Cpath d='M0,6 v6 h4 l5,5 v-16 l-5,5 h-4 z' /%3E%3Cpath d='M13.5,9 c0,-1.8 -1,-3.3 -2.5,-4 v8 c1.5,-0.7 2.5,-2.2 2.5,-4 z' /%3E%3Cpath d='M11,.2 v2 c3,1 5,3.6 5,6.8 s-2,5.8 -5,6.7 v2 c4,-0.8 7,-4.4 7,-8.7 s-3,-8 -7,-8.8 z' /%3E%3C/svg%3E") no-repeat center;
        opacity: .05;
      }
    }

  } // .slide

  .sidebar {
    z-index: $layer-buttons;
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

} // .slider

</style>
