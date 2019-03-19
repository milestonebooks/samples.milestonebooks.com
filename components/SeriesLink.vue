<template>
  <aside :class="`series-link ${dir} ${isDisabled ? 'disabled' : ''}`">
    <div class="axis-x"><div class="axis-y">
      <button class="btn btn-opt btn-context ltr" :style="buttonStyle" :title="getTitle" :aria-label="getLabel" tabindex="0" :disabled="isDisabled" @click="">
        <span class="img-wrapper">
          <img class="img-series" :src="imageSrc" />
        </span>
      </button>
    </div></div>
  </aside>
</template>

<script>
import settings from '~/assets/settings';

import mixins    from '~/plugins/mixins.vue';
import nextFrame from '~/plugins/nextFrame';
import sleep from '~/plugins/sleep';

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
      return `[${this.dir === 'prev' ? 'previous' : 'next'} title here]`;
    },

    getLabel() {
      return `${this.dir === 'prev' ? 'previous' : 'next'} in series`;
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
      return null;//this.img.file ? `${this.$_.urlBaseImg}${this.img.file}` : null;
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

//----------------------------------------------------------------------------------------------------------------------
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.series-link {
  @include absolute-center(y);
  overflow: auto; // TODO necessary?

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;
  }

  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;
  }

} // .series-link

</style>
