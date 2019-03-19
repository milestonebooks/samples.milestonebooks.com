<template>
  <aside :class="`series-link ${dir} ${isDisabled ? 'disabled' : ''}`">
    <nuxt-link tag="button" class="btn ltr" :title="getTitle" :aria-label="getLabel" tabindex="0" :disabled="isDisabled" :to="getLink" replace>
      <span class="img-wrapper">
        <img class="img-series" :src="imageSrc" />
      </span>
    </nuxt-link>
  </aside>
</template>

<script>
import mixins from '~/plugins/mixins.vue';

import { mapGetters, mapMutations } from 'vuex';

export default {

  //--------------------------------------------------------------------------------------------------------------------

  props: {
    dir: String,
    currentIndex: Number,
  },

  computed: {
    ...mapGetters({getSeriesSlide: 'series/getSlide'}),
    ...mapGetters({getItemSlide:   'item/getSlide'}),

    $_() {
      return this.$store.state;
    },
    $_i() {
      return this.$store.state.item;
    },
    $_s() {
      return this.$store.state.series;
    },

    getTitle() {
      return this.getSeriesSlide(this.dir === 'prev' ? -1 : +1, 'title');
    },

    getLabel() {
      return `${this.dir === 'prev' ? 'previous' : 'next'} in series`;
    },

    getLink() {
      const slide = this.getSeriesSlide(this.dir === 'prev' ? -1 : +1);
      return slide ? '/' + slide.code + '/' : null;
    },

    isEnabled() {
      return this.$store.getters.isSamplesShown
        && ((this.dir === 'prev' && !this.getItemSlide(-1) && this.getSeriesSlide(-1))
        ||  (this.dir === 'next' && !this.getItemSlide(+1) && this.getSeriesSlide(+1)));
    },

    isDisabled() {
      return !this.isEnabled;
    },

    imageSrc() {
      const img = this.getSeriesSlide(-1, 'image');
      return img ? `${this.$_.urlBaseImg}${img.file}` : null;
    },
  }, // computed {}

  //====================================================================================================================

  watch: {
  },

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
//----------------------------------------------------------------------------------------------------------------------
// TRANSITION
@import "../assets/settings.scss";

.series-links-pane {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

//----------------------------------------------------------------------------------------------------------------------
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.series-link {
  pointer-events: all;
  z-index: $layer-the-navbar - 1;
  @include absolute-center(y);
  @include short-transition;

  &.disabled {
    pointer-events: none;
    opacity: 0 !important;
  }

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;

    & .btn {
      left: 0;
      transform: translateX(-50%) translateY(-50%) scale(2);
      &:hover {
        transform: translateX(-40%) translateY(-50%) scale(2.1);
      }
    }
  }

  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;

    & .btn {
      right: 0;
      transform: translateX(50%) translateY(-50%) scale(2);
      &:hover {
        transform: translateX(40%) translateY(-50%) scale(2.1);
      }
    }
  }

  .btn {
    height: unset;
    @include drop-shadow;
    box-shadow: 0 0 calc(1em / 2) $drop-shadow-color;
  }

} // .series-link

</style>
