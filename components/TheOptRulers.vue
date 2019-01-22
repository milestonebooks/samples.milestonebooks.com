<template>
  <div class="the-samples-rulers">
    <aside class="the-opt-rulers controls sidebar floating">
      <button class="btn btn-opt btn-rulers ltr" tabindex="1" :title="`${s.showRulers ? 'hide' : 'show'} rulers`" @click="toggleRulers">
        <SvgIcon view="28" :d="btnRulerPath" />
      </button>
    </aside>

    <transition name="rulers">
      <div :class="`rulers ${isUseTouch ? 'touch' : ''}`" v-show="s.showRulers">
        <div v-for="cls of ['x right','y top','x left r','y bottom r']" :class="`ruler ${cls}`"><b v-for="i of 20"></b><div class="target"></div></div> <!-- 20 * 80px = (monitors up to 1600px) -->
      </div>
    </transition>
  </div>
</template>

<script>
import SvgIcon from './SvgIcon';

import settings from '~/assets/settings';

export default {
  components: {
    SvgIcon,
  },

  data () {
    return {
      $rulers:    null,
      isUseTouch: false,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },

    btnRulerPath() {
      // <https://codepen.io/livelysalt/pen/Emwzdj>
      return 'M2,8 h24 v12 h-24 v-12' +
        'h2 v10 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2' +
        'v-8 h-22';
    },
  }, // computed {}

  //--------------------------------------------------------------------------------------------------------------------

  watch: {

    's.showRulers'() { this.onToggleRulers() },

    's.currentWScale'() { this.scaleRulers() },

  }, // watch {}

  //====================================================================================================================

  mounted() {
    this.$rulers = window.$(this.$el).find('.rulers');

    window.addEventListener('resize', this.positionRulers);
    window.addEventListener('orientationchange', this.scaleRulers); // needs because Safari scales image without scaling rulers

    if (this.s.showRulers) {
      this.scaleRulers();
      this.onToggleRulers();
    }
  },

  beforeDestroy () {
    window.removeEventListener('resize', this.positionRulers);
    window.removeEventListener('orientationchange', this.scaleRulers);
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    toggleRulers() {
      this.$store.commit('set', {showRulers: !this.s.showRulers});
    }, // toggleRulers()

    //------------------------------------------------------------------------------------------------------------------

    onToggleRulers() {
      if (this.s.showRulers) {
        this.$rulers[0].addEventListener('touchstart', this.onRulersTouchstart);
        window.addEventListener('mousemove', this.positionRulers);

      } else {
        this.$rulers[0].removeEventListener('touchstart', this.onRulersTouchstart);
        window.removeEventListener('mousemove', this.positionRulers);

        this.$rulers.css({
          left: '',
          top:  '',
        });
      }

    }, // onToggleRulers()

    //------------------------------------------------------------------------------------------------------------------

    positionRulers(event, {touch = false} = {}) {
      let {clientX:x, clientY:y} = event;

      // screen out touch taps, which trigger 'mousemove' events with no movement
      if (event.movementX !== undefined && event.movementX + event.movementY === 0) return false;

      if (!touch) this.isUseTouch = false;

      if (x === undefined) {
        x = this.$rulers.offset().left;
      } else {
        x -= window.$(this.$el).offsetRect().left;
      }
      if (y === undefined) {
        y = this.$rulers.offset().top;
      } else {
        y -= window.$(this.$el).offsetRect().top;
      }

      // keep within view
      const scale  = settings.DPI_DEFAULT / this.s.currentWScale;
      const offset = ((settings.RULER_WIDTH_NOMINAL * (this.s.dpi / scale)) - 1) / 2;
      const $el    = window.$('#the-samples');

      x = Math.min(Math.max(x, offset), $el.width()  - offset);
      y = Math.min(Math.max(y, offset), $el.height() - offset);

      this.$rulers.css({
        left: `${x}px`,
        top:  `${y}px`,
      });
    }, // positionRulers()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchstart(e) {
      const touches = e.touches ? e.touches[0] : e;

      this.noTransition = true;
      this.isUseTouch = true;

      this.$rulers[0].addEventListener('touchmove', this.onRulersTouchmove);
      this.$rulers[0].addEventListener('touchend',  this.onRulersTouchend);

      this.touchPoint = {
        $el: this.$rulers,
        rulerX: this.$rulers.offset().left,
        rulerY: this.$rulers.offset().top,
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

      const x = this.touchPoint.rulerX + this.touchPoint.deltaX;
      const y = this.touchPoint.rulerY + this.touchPoint.deltaY;

      this.positionRulers({
        clientX: x,
        clientY: y,
      }, {touch:true});

    }, // onRulersTouchmove()

    //------------------------------------------------------------------------------------------------------------------

    onRulersTouchend() {
      // cleanup
      this.$rulers[0].removeEventListener('touchmove', this.onRulersTouchmove);
      this.$rulers[0].removeEventListener('touchend',  this.onRulersTouchend);

      this.noTransition = false;

    }, // onRulersTouchend()

    //------------------------------------------------------------------------------------------------------------------

    scaleRulers() {
      if (this.s.dpi === settings.DPI_DEFAULT) {
        this.$rulers.css({
          transform: `scale(${this.s.currentWScale})`,
          width: `${200 / this.s.currentWScale}%`, // see style rule: .rulers { width }
        }).find('.target').css({
          transform: `scaleY(${1 / this.s.currentWScale})`
        });
      }
    }, // scaleRulers()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$ruler-inch: 80px;
$ruler-width-half: ($ruler-width-nominal - 1) / 2;

$layer-rulers: 1;

.the-samples-rulers {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;

  & > * {
    pointer-events: all;
  }
}

.the-opt-rulers {
  z-index: $layer-the-nav - 1;
  top: 1em;
  right: 1em;
  width: $unit;
}

.btn-rulers::after {
  content: '';
  @include absolute-center();
  width: 3.2em;
  height: 3.2em;
  border-radius: 50%;
  @include short-transition;

  @at-root .show-rulers & {
    background-color: $btn-toggle-bg-color;
  }
}

.rulers {
  z-index: $layer-rulers;
  pointer-events: none;
  opacity: .75;
  position: absolute;
  left: calc(100% - (1em + (#{$unit} / 2)));
  /*
  @at-root .shell.has-scrollbar-y & {
    left: calc(100% - 17px - (1em + (#{$unit} / 2)));
  }
  //*/
  top:  1em + ($unit / 2);
  width: 200%; // rulers are rotated by transform so no height is necessary, but width should be at least double to accommodate aspect ratios up to 2:1 (only edge cases beyond 16:9)
  transform-origin: 0 0;

  &.rulers-leave-active,
  .show-rulers &.rulers-enter-active {
    @include short-transition;
  }

  transition: transform $transition-time-ms ease-in-out; // used for zooming
  @at-root .no-transition + .the-samples-rulers #{&}, // applied while dragging
  &.no-transition { // applied while zooming
    transition: none;
  }

  /* [2018-10-31] TODO: change to a hideable Tip component
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
    @at-root .show-rulers .rulers:not(.rulers-enter-active)::before {
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
    @at-root .show-rulers .rulers:not(.rulers-enter-active)::after {
      opacity: 0;
      transform: translateX(2.5em);
    }
  }
  //*/
}

.ruler {
  position: absolute;
  left: $ruler-width-half;
  top: -$ruler-width-half;
  height: $ruler-width-nominal - 1;
  background-color: hsl(60, 100%, 50%);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='#{$ruler-inch}' height='#{$ruler-width-nominal - 1}' viewBox='0 0 #{$ruler-inch} #{$ruler-width-nominal - 1}'%3E%3Cpath d='M0,16 l 80,0 M10,12 l 0,7 M20,9 l 0,13 M30,12 l 0,7 M40,6 l 0,19 M50,12 l 0,7 M60,9 l 0,13 M70,12 l 0,7 M80,0 l 0,31' stroke='black' shape-rendering='crispEdges' /%3E%3C/svg%3E");
  counter-reset: inches;
  transform-origin: -#{$ruler-width-half} #{$ruler-width-half};
  transition: width $transition-time-ms ease-in-out;

  @at-root [data-dpi="120"] & {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='#{$ruler-inch * $zoom-ratio}' height='#{$ruler-width-nominal * $zoom-ratio - 1}' viewBox='0 0 #{$ruler-inch * $zoom-ratio} #{$ruler-width-nominal * $zoom-ratio - 1}'%3E%3Cpath d='M0,24 l 120,0 M15,19 l 0,9 M30,14 l 0,19 M45,19 l 0,9 M60,10 l 0,29 M75,19 l 0,9 M90,14 l 0,19 M105,19 l 0,9 M119.9,0 l 0,47' stroke='black' shape-rendering='crispEdges' /%3E%3C/svg%3E");
    left:  ($ruler-width-nominal * $zoom-ratio - 1) / 2;
    top:  -($ruler-width-nominal * $zoom-ratio - 1) / 2;
    height: $ruler-width-nominal * $zoom-ratio - 1;
    transform-origin: -#{($ruler-width-nominal * $zoom-ratio - 1) / 2} #{($ruler-width-nominal * $zoom-ratio - 1) / 2};
  }

  &.y.top {
    transform: rotate(-90deg);
  }
  &.x.left {
    transform: rotate(-180deg);
  }
  &.y.bottom {
    transform: rotate(-270deg);
  }

  width: 0;
  @at-root .show-rulers & {
    width: 100% !important;
    pointer-events: all;
  }
  overflow: hidden;
  @at-root .show-rulers .rulers:not(.rulers-enter-active):not(.rulers-leave-active) .ruler {
    overflow: visible;
  }

  // used to make touch target physically consistent when ruler size is scaled down
  .target {
    height: 100%;
    transform: scaleY(1);

    // make ruler cross-axis hole targetable for dragging (this prevents tap-to-zoom within the hole)
    @at-root .rulers.touch .target::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      left: -50%;
    }
  }

  b {
    float: left;
    margin-bottom: 200%; // when overflow:hidden is not used on .ruler, margin ensures any wrapped elements are offscreen
    position: relative;
    width: $ruler-inch;
    height: $ruler-width-nominal - 1;
    @at-root [data-dpi="120"] & {
      width: $ruler-inch * $zoom-ratio;
      height: $ruler-width-nominal * $zoom-ratio - 1;
    }

    &::after {
      counter-increment: inches;
      content: counter(inches);
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translate(-50%, -50%) translate(-0.5px, 0); // sequential because IE11 doesn't support calc() here
      @at-root .ruler.r b::after {
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
} // .ruler

</style>
