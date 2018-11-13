<template>
  <AppFrame id="the-samples">
    <AppSlider slot="view"
               :slides="s.samples" :currentIndex="s.currentIndex" :defaultDpi="80" :zoomDpi="120"
               v-bind="{imageSrc, onImageLoaded, onImageLoadError}"></AppSlider>

    <template slot="frame">
      <span style="color:red;">TheSamples [{{ this.s.currentIndex }}] of {{ this.s.samples.length }}</span>

      <TheOptRulers v-if="s.hasRulers" />

      <TheNav v-if="s.samples.length > 1" />

      <TheOptRevert v-if="s.type === 'items'" />
    </template>
  </AppFrame>
</template>

<script>
import AppFrame  from '~/components/AppFrame';
import AppSlider from '~/components/AppSlider';

import TheOptRulers from '~/components/TheOptRulers';
import TheOptRevert from '~/components/TheOptRevert';
import TheNav       from '~/components/TheNav';

import settings from '~/assets/settings';

import { mapGetters } from 'vuex';

export default {
  components: {
    AppFrame,
    AppSlider,
    TheOptRulers,
    TheOptRevert, // TODO: temporary
    TheNav,
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters([
      'imageSrc',
    ]),

    s() {
      return this.$store.state;
    },
  }, // computed {}

  mounted() {
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    onImageLoaded(i, dpi, event) {
      this.$store.commit('setImageLoaded', {i, dpi});

      // use 80-dpi image as scaled background until 120-dpi image loads
      if (dpi === settings.DPI_DEFAULT && !this.s.samples[i].image.loaded[settings.DPI_ZOOM]) {
        // jQuery avoids throwing errors if no match found
        window.$(this.$el).find(`.frame.dpi120 [data-index="${i}"] img`).css({'background-image': `url("${event.target.src}")`});
      }
      // use 120-dpi image to avoid unnecessary downloads
      if (dpi === settings.DPI_ZOOM && !this.s.samples[i].image.loaded[settings.DPI_DEFAULT]) {
        this.$el.querySelector(`.frame.dpi80 [data-index="${i}"] img`).src = event.target.src;
      }
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoadError(i, dpi) {
      this.$store.commit('setImageLoaded', {i, dpi, loaded:false});
      this.$el.querySelector(`.frame.dpi${dpi} [data-index="${i}"] img`).removeAttribute('src');
    }, // onImageLoadError()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

#the-samples {
  right: 50px;
  bottom: 50px;
  width: 40%;
  height: 50vh;
  outline: 1px solid red;
}

</style>
