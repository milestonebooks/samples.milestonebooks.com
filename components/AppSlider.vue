<template>
  <article :class="['slider',sliderClass]" :aria-grabbed="isGrabbing">

    <div class="frame-masks">
      <div v-for="cls of ['side above','side below']" :class="`frame-mask ${cls}`"></div>
    </div>

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
    slides: Array, // array of objects that must contain {item:String, title:String, ?image:{file:String, h:Number, w:Number, hRatio:Number, loaded:{}}}
    currentIndex: Number,
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

  mounted() {
    this.width  = this.$el.offsetWidth;
    this.height = this.$el.offsetHeight;
    this.availWidth  = this.$el.clientWidth;
    this.availHeight = this.$el.clientHeight;
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    getSlide(dir = 0, key, currentIndex = null) {
      const i = (currentIndex === null ? this.currentIndex : currentIndex) + dir;
      const sample = (this.slides[i] ? this.slides[i] : null);
      return sample && key ? sample[key] : sample;
    }, // getSlide()

    //--------------------------------------------------------------------------------------------------------------------

    listItemClass(slide) {
      const i = slide.index;

      return 'item'
        + ` ${i < this.currentIndex ? 'before-' : i > this.currentIndex ? 'after-' : ''}current`
        + (slide.nonsequential ? ' non-' : ' ') + 'sequential-before'
        + (i < this.slides.length - 1 && this.slides[i + 1].nonsequential ? ' non-' : ' ') + 'sequential-after';
    }, // listItemClass()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$layer-frame-mask: 2; // above both <.frame>s to mask grab zones

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

</style>
