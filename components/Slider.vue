<template>
  <article :class="['slider',sliderClass]" :aria-grabbed="isGrabbing">
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
      isInit:       false,
      isGrabbing:   false,
      isScrolling:  null,
      noTransition: true,
      width:        this.$el.offsetWidth,
      height:       this.$el.offsetHeight,
      availWidth:   this.$el.clientWidth,
      availHeight:  this.$el.clientHeight,
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

    isFirst() {
      return this.getSlide && !this.getSlide(-1);
    },

    isLast() {
      return this.getSlide && !this.getSlide(+1);
    },

    sliderClass() {
      return {
        'is-init':  this.isInit,
        'has-prev': !this.isFirst,
        'has-next': !this.isLast,
        'no-transition': this.noTransition,
      }
    },

  }, // computed {}

  //--------------------------------------------------------------------------------------------------------------------

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
