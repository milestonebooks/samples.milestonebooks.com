<template>
  <aside :class="`series-link ${dir} ${isDisabled ? 'disabled' : 'enabled'}`" :style="styleHeight">
    <button class="btn ltr" :title="getTitle" :aria-label="getLabel" tabindex="0" :disabled="isDisabled" @click="goTo">
      <span class="img-wrapper">
        <img class="img-series" :src="imageSrc" />
      </span>
    </button>
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

    slide() {
      return this.getSeriesSlide(this.dirIndex) || {};
    },

    dirIndex() {
      return this.dir === 'prev' ? -1 : +1;
    },

    getTitle() {
      return this.slide.title || null;
    },

    getLabel() {
      return `${this.dir === 'prev' ? 'previous' : 'next'} in series`;
    },

    isEnabled() {
      return this.$store.getters.isSamplesShown && !this.getItemSlide(this.dirIndex) && this.slide.code;
    },

    isDisabled() {
      return !this.isEnabled;
    },

    imageSrc() {
      return this.slide.image ? `${this.$_.urlBaseImg}${this.slide.image.file}` : null;
    },

    styleHeight() {
      return this.slide.image ? `height: ${Math.floor(this.slide.image.hRatio * 80)}px` : null; // pixel rounding provides smoother animation
    },
  }, // computed {}

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

    async goTo() {

      const s  = this.slide;
      const to = `/${s.code}/` + (this.dirIndex < 0 ? `#${s.samples[s.samples.length - 1].id}` : '');
      this.$router.push(to);

    }, // goTo()

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
  width: $unit;
  @include short-transition;

  &.disabled {
    pointer-events: none;
  }

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;

    & .btn {
      left: 0;
      transform: translateX(-50%) translateY(-50%);
    }
    &.disabled .btn {
      transform: translateX(-50%) translateY(-50%) translateX(-50%);
    }
    &:hover .btn {
      transform: translateX(-50%) translateY(-50%) translateX(10%);
    }
  }

  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;

    & .btn {
      right: 0;
      transform: translateX(50%) translateY(-50%);
    }
    &.disabled .btn {
      transform: translateX(50%) translateY(-50%) translateX(50%);
    }
    &:hover .btn {
      transform: translateX(50%) translateY(-50%) translateX(-10%);
    }
  }

  .btn {
    width: 2 * $unit;
    height: 100%;
  }
  &.enabled .btn {
    @include drop-shadow;
  }

} // .series-link

</style>
