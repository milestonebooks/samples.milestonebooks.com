<!-- adapted from https://www.reddit.com/r/vuejs/comments/852sy4/best_slider_swiper_im_having_trouble_with/ -->
<template>
  <div class="swiper-container">
    <slot name="before-wrapper"/>
    <div class="swiper-wrapper">
      <slot/>
    </div>
    <div v-if="defaultPagination" class="swiper-pagination"></div>
    <div v-if="defaultScrollbars" class="swiper-scrollbar"></div>
    <div v-if="defaultNavigation" class="swiper-button-next"></div>
    <div v-if="defaultNavigation" class="swiper-button-prev"></div>
    <slot name="after-wrapper"/>
  </div>
</template>

<script>
import { Swiper, A11y, Keyboard, Navigation } from 'swiper/dist/js/swiper.esm.js'; // TODO: precompile or wait until ESM works in Node 10
import merge from 'lodash-es/merge';

// see http://idangero.us/swiper/api/#custom-build
Swiper.use([Navigation, Keyboard, A11y]);

export default {
  name: 'Swiper2',
  props: {
    options: { type: Object, required: true },
  },

  computed: {
    defaultPagination() {
      return this.options.pagination && !this.options.pagination.el;
    },
    defaultScrollbars() {
      return this.options.scrollbar && !this.options.scrollbar.el;
    },
    defaultNavigation() {
      const { navigation: nav } = this.options;
      return nav && (!nav.nextEl && !nav.prevEl);
    },
  },

  watch: {
    options() {
      this.recreateSwiper();
    },
  },

  mounted() {
    this.recreateSwiper();
  },

  updated() {
    this.swiper.update();
  },

  beforeDestroy() {
    if (this.swiper) this.swiper.destroy();
  },

  methods: {
    control(swiper) {
      this.controlled = swiper;
      this.recreateSwiper();
    },

    recreateSwiper() {
      if (this.swiper) this.swiper.destroy();

      this.swiper = new Swiper(
        this.$el,
        merge(
          {
            preloadImages: false,
            keyboard: {
              enabled: true,
              onlyInViewport: true,
            },
            a11y: true,
            navigation: {},
          },
          this.options,
          {
            controller: {
              control: this.controlled,
            },
          },
        ),
      );

      this.$emit('update:swiper', this.swiper);
    },
  },
}
</script>
