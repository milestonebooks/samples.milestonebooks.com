<template>
  <article class="slider js_slider">
    <div class="frame js_frame">
      <div class="slides js_slides">
        <section v-for="sample in samples" :key="sample.id" class="slide js_slide">{{sample.id}}</section>
      </div>
    </div>
  </article>
</template>

<script>
import { lory } from 'lory.js';

import settings from '~/assets/settings';

export default {

  props: {
    options: Object,
    samples: Array,
    currentIndex: Number,
  },

  data () {
    return {
      slider: null,
      defaultOptions: {
        slideSpeed: settings.TRANSITION_TIME_MS,
      }
    }
  },

  watch: {
    samples: 'setup',
    currentIndex: 'update',
  },

  mounted () {
  },

  beforeDestroy () {
    this.slider.destroy()
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    setup() {
      this.$nextTick(() => {
        this.$el.addEventListener('on.lory.touchstart', () => {
          this.$el.classList.add('grabbing');
        });
        this.$el.addEventListener('on.lory.touchend', () => {
          this.$el.classList.remove('grabbing');
        });
        this.$el.addEventListener('after.lory.slide', (e) => {
          console.log('slide', e.detail);
        });
        if (!this.slider && this.samples.length) this.slider = lory(this.$el, Object.assign(this.defaultOptions, this.options));
      });
    }, // setup()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      this.$nextTick(() => {
        if (this.slider) this.slider.slideTo(this.currentIndex);
      });
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods {}

  //====================================================================================================================

}
</script>

<style lang="scss">
/**
 * (optional) define here the style definitions which should be applied on the slider container
 * e.g. width including further controls like arrows etc.
 */

.slider {

  .frame {
    /**
     * (optional) wrapper width, specifies width of the slider frame.
     */
    width: 100%;

    position: relative;
    font-size: 0;
    line-height: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  .slides {
    box-sizing: border-box;
    padding: 0;
    width: 100%;
    display: inline-block;
  }

  .slide {
    // (optional) if the content inside the slide element has a defined size.
    width: 100%;

    position: relative;
    display: inline-block;
    text-align: center;
    font-size: 15px;
    line-height: 30px;
  }

  &:not(.grabbing) .slide {
    cursor: grab;
  }
  &.grabbing .slide {
    cursor: grabbing;
  }

  .prev, .next {
    position: absolute;
    top: 50%;
    margin-top: -25px;
    display: block;
    cursor: pointer;
  }

  .next {
    right: 0;
  }

  .prev {
    left: 0;
  }

  .next svg, .prev svg {
    width: 25px;
  }

  &.js_rewind {
    .frame li {
      margin-right: 10px;
    }
  }
}
</style>
