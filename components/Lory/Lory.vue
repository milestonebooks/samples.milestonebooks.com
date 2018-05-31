<template>
  <article class="slider js_slider">
    <div class="frame js_frame">
      <div class="slides js_slides">
        <slot></slot>
      </div>
    </div>
    <slot name="actions"></slot>
  </article>
</template>

<script>
import { lory } from 'lory.js';

export default {

  props: {
    options: {
      type: Object,
      default: () => {}
    },
    samples: {
      type: Array,
      default: () => []
    }
  },

  data () {
    return {
      slider: null
    }
  },

  watch: {
    samples: 'setup',
  },

  mounted () {
    console.log('mounted', this.samples.length);
    this.slider = lory(this.$el, this.options);
  },

  beforeDestroy () {
    this.slider.destroy()
  },

  methods: {
    setup() {
      console.log('setup', this.samples.length);
      this.slider.setup();
    },
  }

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
    position: relative;
    display: inline-block;

    /**
     * (optional) if the content inside the slide element has a defined size.
     */
    width: 100%;

    position: relative;
    display: inline-block;
    text-align: center;
    font-size: 15px;
    line-height: 30px;
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
