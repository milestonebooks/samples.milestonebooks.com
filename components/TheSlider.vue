<template>
  <article :class="sliderClass" :aria-grabbed="isGrabbing" :data-debug="debug">

    <div class="frame-masks">
      <div v-for="cls of ['end prev','end next','side above','side below']" :class="`frame-mask ${cls}`"></div>
    </div>

    <div class="frame-rulers">
      <div v-for="cls of ['x right','y top','x left r','y bottom r']" :class="`frame-ruler ${cls}`"><b v-for="i of 20"></b></div> <!-- 20 * 80px = (monitors up to 1600px) -->
    </div>

    <div class="frame dpi80">
      <div class="slides">
        <section v-for="sample in samples" :key="sample.id" :data-index="sample.index"
                 :class="`slide ${listItemClass(sample)}`" :style="sampleStyleSize(sample, 80)">
          <div class="slide-liner">
            <img v-if="sample.image" data-dpi="80" :style="imageStyleSize(sample, 80)" :data-src="imageSrc(sample, 80)" @load="onImageLoaded(sample.index, 80)" draggable="false" />
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
            <img data-dpi="120" :style="imageStyleSize(sample, 120)" :data-src="imageSrc(sample, 120)" @load="onImageLoaded(sample.index, 120)" draggable="false" />
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

import { mapGetters } from 'vuex';

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
      availHeight:  document.documentElement.clientHeight,
      availWidth:   document.documentElement.clientWidth,
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
        'slider': true,
        'is-init': this.isInit,
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

  },

  //====================================================================================================================

  mounted() {
    window.addEventListener('resize', this.onResize);
    this.$el.addEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.addEventListener('mousedown',  this.onTouchstart);
    if (this.s.showRulers) this.toggleRulers();
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.onResize);
    this.$el.removeEventListener('touchstart', this.onTouchstart, this.eTouchParams);
    this.$el.removeEventListener('mousedown',  this.onTouchstart);
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    update() {
      this.autosize();
      console.log('TheSlider update()', this.currentIndex, 'isInit?', this.isInit);
      if (!this.isInit) this.init();
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initImages();
      this.isInit = true;
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    imageStyleSize(sample, dpi = 80) {
      return {
        width:  `${Math.ceil(sample.image.w * dpi)}px`,
        height: `${Math.ceil(sample.image.h * dpi)}px`,
      };
    }, // imageStyleSize()

    //------------------------------------------------------------------------------------------------------------------

    imageSrc(sample, dpi) {
      return `${this.s.urlBase}${this.s.type === 'audio' ? 'audio' : 'items'}/${this.s.item}/${this.s.item}.${sample.id}(${dpi}).${sample.image.ext}`;
    }, // imageSrc()

    //------------------------------------------------------------------------------------------------------------------

    initImages() {

      let images = document.querySelectorAll('[data-src]');

      //const config = {rootMargin: '0% -50% 0% 0%'};
      const config = {rootMargin: '0px'};

      const observer = new IntersectionObserver((entries, self) => {
        entries = Array.prototype.slice.call(entries, 0); // cast NodeList to Array to support IE/Edge
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.preloadImage(entry.target);
            self.unobserve(entry.target);
          }
        });
      }, config);

      images = Array.prototype.slice.call(images, 0); // cast NodeList to Array to support IE/Edge
      images.forEach(image => { observer.observe(image); });

    }, // initImages()

    //------------------------------------------------------------------------------------------------------------------

    preloadImage(img) {
      const src = img.getAttribute('data-src');
      if (img.src || !src) return;
      img.src = src;
    }, // preloadImage()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoaded(i, dpi) {
      console.log('TODO: onImageLoaded', i, dpi);
      // TODO: multiple size images; lazy loading; fadein when current image has loaded
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onResize() {
      this.availHeight = document.documentElement.clientHeight;
      this.availWidth  = document.documentElement.clientWidth;

      //console.log(`onresize: ${this.availWidth}w X ${this.availHeight}h`);

      clearTimeout(window._resizeT);

      window._resizeT = setTimeout(async () => {
        this.autosize({resize:true});
      }, settings.TRANSITION_TIME_MS);

    }, // onResize()

    //------------------------------------------------------------------------------------------------------------------

    autosize({resize = false, dpi = null} = {}) {
      const index = this.currentIndex;

      if (!dpi) dpi = this.s.dpi;

      // the IntersectionObserver [see initImages()] will lazy-load images in the sequence of crossing the threshold
      // this ensure the current image loads first, which is useful when scrolling past many slides via the nav list
      if (this.s.samples[this.currentIndex].image) {
        this.preloadImage(window.$(`.frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"] img`)[0]);
      }

      //console.log(`autosize(${dpi}) isInit?`, this.isInit);

      const $slider = window.$('.slider');
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
            height: `${frameHeight}px`,
            width:  `${frameWidth}px`,
          });
          window.$('.frame-mask.end').css({width: `${xMargin}px`});
          window.$('.frame-mask.side').css({height: `${yMargin}px`});
        }

        $frame.css({
          height: `${frameHeight}px`,
          width:  `${frameWidth}px`,
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

    sampleStyleSize(sample, dpi = 80) {
      const xdpi = sample.image ? dpi : 1;
      // TODO: taking the width from the clientHeight can cause weird alignment issues on resizing
      const w    = sample.image ? Math.ceil(sample.image.w * xdpi) : Math.min(this.availWidth, document.documentElement.clientHeight);
      let   h    = sample.image ? Math.ceil(sample.image.h * xdpi) : null;

      if (sample.audio) h += 40; // add some vertical padding so sheet music won't be obscured by controls

      // mouse interactions can scroll; non-mouse is presumed to be a touch device, which can use native pinch-zoom and pan
      /* TODO: recalculates on first hover, which can cause shifting
      if (w > this.availWidth && !this.s.hasMouse) {
        const hRatio = h / w;
        w = this.availWidth;
        h = Math.floor(w * hRatio);
      }
      //*/

      const width    = `${w}px`;
      const height   = sample.image ? `${h}px` : '';
      const maxWidth = sample.image ? '' : '650px'; // sheet music width

      //console.log(`sampleStyleSize(): availWidth:${this.availWidth}`); // w:${width} h:${height}`);

      return {width, height, maxWidth};
    }, // sampleStyleSize()

    //------------------------------------------------------------------------------------------------------------------

    onTouchstart(e) {
      const touches = e.touches ? e.touches[0] : e;

      const $frame = window.$(touches.target).closest('.frame');

      if (!$frame.length) return;

      const el = $frame[0];

      el.addEventListener('touchmove', this.onTouchmove, this.eTouchParams);
      el.addEventListener('mousemove', this.onTouchmove);
      el.addEventListener('touchend',  this.onTouchend);
      el.addEventListener('mouseup',   this.onTouchend);

      const {pageX, pageY} = touches;

      const {xOffset, yOffset} = this.getSlideOffset($frame.find(`[data-index="${this.currentIndex}"]`));

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
        this.isScrolling = !!(this.isScrolling || Math.abs(this.touchPoint.deltaX) < Math.abs(this.touchPoint.deltaY));
      }

      if (!this.isScrolling) {
        this.isGrabbing = true;
        window.$('.slider').addClass('no-transition');

        const $slides = window.$(this.touchPoint.el).find('.slides');
        const XY = `${-this.touchPoint.slidesX + this.touchPoint.deltaX}px, ${-this.touchPoint.slidesY}px`;
        $slides.css({
          'transform': (this.supports3d ? `translate3d(${XY}, 0)` : `translate(${XY})`),
        });
      }
    }, // onTouchmove()

    //------------------------------------------------------------------------------------------------------------------

    onTouchend(e) {
      // cleanup
      const el = this.touchPoint.el;
      el.removeEventListener('touchmove', this.onTouchmove, this.eTouchParams);
      el.removeEventListener('mousemove', this.onTouchmove);
      el.removeEventListener('touchend',  this.onTouchend);
      el.removeEventListener('mouseup',   this.onTouchend);

      this.touchPoint.el = null;

      this.isScrolling = null;

      this.isGrabbing = false;

      window.$('.slider').removeClass('no-transition');

      this.forceRepaint();

      // decide what the interaction means
      let action = 'click';
      const duration = Date.now() - this.touchPoint.time;
      const diffX = Math.abs(this.touchPoint.deltaX);
      const diffY = Math.abs(this.touchPoint.deltaY);
      const dir = (this.touchPoint.deltaX < 0 ? 'left' : 'right');

      const slideWidth = window.$(`.frame.dpi${this.s.dpi} [data-index="${this.currentIndex}"]`).width();

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
        this.autosize();
      }
    }, // onTouchend()

    //------------------------------------------------------------------------------------------------------------------

    toggleRulers() {
      const $rulers = window.$('.frame-rulers');
      if (this.s.showRulers) {
        $rulers[0].addEventListener('touchstart', this.onRulersTouchstart);
        window.addEventListener('mousemove', this.positionRulers);
      } else {
        $rulers[0].removeEventListener('touchstart', this.onRulersTouchstart);
        window.removeEventListener('mousemove', this.positionRulers);
      }
    }, // toggleRulers()

    //------------------------------------------------------------------------------------------------------------------

    positionRulers(event) {
      const {clientX:x, clientY:y} = event;

      window.$('.frame-rulers').css({
        left: `${x}px`,
        top:  `${y}px`,
      });
    }, // positionRulers()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchstart(e) {
      const touches = e.touches ? e.touches[0] : e;

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

      const offset = (settings.FRAME_RULER_WIDTH / 2) * (this.s.dpi / 80);

      // keep within view
      x = Math.min(Math.max(x, offset), this.availWidth  - offset);
      y = Math.min(Math.max(y, offset), this.availHeight - offset);

      this.positionRulers({
        clientX: x,
        clientY: y,
      });

    }, // onRulersTouchmove()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchend() {
      // cleanup
      const $rulers = window.$('.frame-rulers');

      $rulers[0].removeEventListener('touchmove', this.onRulersTouchmove);
      $rulers[0].removeEventListener('touchend',  this.onRulersTouchend);

    }, // onRulersTouchend()

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

      // TODO: cancel zoom action
      if (this.s.isZooming) return;

      this.$store.commit('set', {isZooming:true});

      const dpi = (this.s.dpi === 80 ? 120 : 80);
      this.$store.commit('set', {dpi});

      const zoomIn = (dpi === 120);

      const index = this.currentIndex;

      const $el        = window.$('.slider');
      const $frame     = $el.find('.frame.dpi80');
      const $frameZoom = $el.find('.frame.dpi120');
      const $slide     = $frame.find(`[data-index="${index}"]`);
      const $slideZoom = $frameZoom.find(`[data-index="${index}"]`);

      // ensure no transitions are in effect to delay prep layout
      $el.addClass('no-transition');

      const w = this.s.samples[index].image.w;
      const h = this.s.samples[index].image.h;

      const xScroll = window.scrollX;
      const yScroll = window.scrollY;

      // TODO: 'rtl' zoom in is buggy
      const metric = (this.s.direction === 'rtl' ? 'right' : 'left');

      if (zoomIn) {
        const xOffset = $slide.offsetRect()[metric];
        const yOffset = $slide.offset().top;

        const xDiff = Math.round((w * elX * (120 - 80)) - xOffset);
        const yDiff = Math.round((h * elY * (120 - 80)) - yOffset);

        const xScrollTo = xScroll + xDiff;
        const yScrollTo = yScroll + yDiff;

        // position the zoom slider to trigger layout and image loading
        $frameZoom.css({display: 'block', position: 'absolute'});
        this.autosize({resize:true});

        // position view to compensate for new layout
        window.scroll(xScrollTo, yScrollTo);

        // when non-zoom frame is contained within view, desired scroll position may not be possible
        const xScrollAdj = window.scrollX - xScrollTo;
        const yScrollAdj = window.scrollY - yScrollTo;

        const xFrame = Math.max(xDiff, 0) + Math.min(xScrollAdj, 0);
        const yFrame = Math.max(yDiff, 0) + Math.min(yScrollAdj, 0);

        // adjust non-zoom frame to original screen position
        $frame.css({transform: `translate(${xFrame}px, ${yFrame}px)`});

        // find origin that will scale to final position
        const xPct = ($slide.offsetRect()[metric] - $slideZoom.offsetRect()[metric]) / ($slideZoom.width()  - $slide.width());
        const yPct = ($slide.offset().top  - $slideZoom.offset().top)  / ($slideZoom.height() - $slide.height());

        const xOrigin = (xOffset + ($slide.width()  * xPct)) / $frame.width();
        const yOrigin = (yOffset + ($slide.height() * yPct)) / $frame.height();

        $frame.css({'z-index': 1});
        $frameZoom.css({opacity: 0});
        $frame.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $el.removeClass('no-transition');
        $frame.addClass('is-zooming').css({transform: `translate(${xFrame}px, ${yFrame}px) scale(${settings.ZOOM_RATIO})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frame.css({'z-index': ''});
        $frameZoom.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        $el.addClass('no-transition');
        $frame.css({opacity: 0, 'pointer-events': 'none'});
        $frame.removeClass('is-zooming').css({transform: ''});

        this.forceRepaint();
        $el.removeClass('no-transition');

      // zoom out
      } else {
        const xOffset = $slide.offset().left;
        const yOffset = $slide.offset().top;

        const xDiff = Math.round((w * elX * (120 - 80)) - (xOffset - $slideZoom.offset().left));
        const yDiff = Math.round((h * elY * (120 - 80)) - (yOffset - $slideZoom.offset().top));

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

        $frameZoom.css({'z-index': 1});
        $frame.css({opacity: 0});
        $frameZoom.css({'transform-origin': `${xOrigin * 100}% ${yOrigin * 100}%`});

        // ensure dom is updated before running zoom transition
        this.forceRepaint();
        $el.removeClass('no-transition');
        $frameZoom.addClass('is-zooming').css({transform: `scale(${1 / settings.ZOOM_RATIO})`});

        await sleep(settings.TRANSITION_TIME_MS);

        // fade
        $frameZoom.css({'z-index': ''});
        $frame.css({'z-index': 1, opacity: 1, 'pointer-events': 'all'});

        await sleep(settings.TRANSITION_TIME_MS);

        // cleanup
        const xScrollTo = Math.max(window.scrollX - $frame.offset().left, 0);
        const yScrollTo = Math.max(window.scrollY - $frame.offset().top,  0);

        $el.addClass('no-transition');
        $frameZoom.css({opacity: 0, 'pointer-events': 'none'});
        $frameZoom.removeClass('is-zooming').css({transform: ''});
        $frame.css({transform: ''});
        $frameZoom.css({position: 'fixed'});
        this.autosize({resize:true});
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

  /*
  &[data-debug]::before {
    content: attr(data-debug);
    z-index: 9;
    position: fixed;
    top: 0;
    left: 0;
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
    opacity: 0;
    position: fixed;
    left: $frame-ruler-width / 2;
    top:  $frame-ruler-width / 2;
    width: 200%;
    height: 200%;
    transition: opacity $transition-time-ms ease-in-out, transform $transition-time-ms ease-in-out;
    transform-origin: 0 0;
    @at-root [data-dpi="120"] .frame-rulers {
      transform: scale($zoom-ratio);
    }
  }
  @at-root .show-rulers .frame-rulers {
    opacity: .75;
  }

  @at-root .show-rulers .frame-ruler {
    pointer-events: all;
  }
  .frame-ruler {
    position: absolute;
    left: $frame-ruler-width / 2;
    top: -$frame-ruler-width / 2;
    width: 100%;
    height: $frame-ruler-width;
    overflow: hidden;
    background-color: hsl(60, 100%, 50%);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='31' viewBox='0 0 80 31'%3E%3Cpath d='M0,16 l 80,0 M10,12 l 0,7 M20,9 l 0,13 M30,12 l 0,7 M40,6 l 0,19 M50,12 l 0,7 M60,9 l 0,13 M70,12 l 0,7 M80,0 l 0,31' stroke='black' shape-rendering='crispEdges' /%3E%3C/svg%3E");
    counter-reset: inches;
    transform-origin: -#{$frame-ruler-width / 2} #{$frame-ruler-width / 2};

    b {
      float: left;
      position: relative;
      width: $frame-ruler-inch;
      height: $frame-ruler-width;

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
    }

    cursor: grab;
    #{$isIE} & {
      cursor: move;
    }
    @at-root [aria-grabbed]#{&} {
      cursor: grabbing;
    }
  } // .frame

  .slides {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
    line-height: 1;

    #{$isIE} & {
      display: inline-block;
    }
    @include short-transition;

    @at-root .no-transition#{&} {
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
    @at-root .frame.dpi120 .slide {
      margin: 0 ($unit * 1/8 * $zoom-ratio);
    }
    @include short-transition;

    &:not(.current) {
      opacity: 0.25;
    }

    // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
    // [2018-07] svg cursor only works in Chrome
    @at-root .has-zoom[data-dpi="80"] .slider:not([aria-grabbed]) .slide.current {
      cursor: zoom-in;
      cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='8' y1='13' x2='18' y2='13' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cline x1='13' y1='8' x2='13' y2='18' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3C/svg%3E") 13 13, zoom-in;
    }
    @at-root .has-zoom[data-dpi="120"] .slider:not([aria-grabbed]) .slide.current {
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
        left: calc(100% + 3rem);
      }
      @at-root [data-dir="rtl"] & {
        right: calc(100% + 3rem);
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

      &::after {
        pointer-events: none;
        @include absolute-center(x);
        content: 'COPYRIGHTED MATERIAL';
        white-space: nowrap;
        bottom: .5em;
        color: darken($alert-color, 25%);
        text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;

        @at-root .dpi120 .slide-liner::after {
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
}

</style>
