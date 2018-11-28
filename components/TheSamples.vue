<template>
  <AppFrame id="the-samples">
    <AppSlider slot="view"
               :slides="s.samples" :currentIndex="s.currentIndex" :defaultDpi="80" :zoomDpi="120"
               v-bind="{imageSrc, onImageLoaded, onImageLoadError}">

      <template slot="frame">
        <TheNav v-if="s.samples.length > 1" />
      </template>

      <template slot="pane">
        <TheOptRulers v-if="s.hasRulers" />

        <TheOptPrint v-if="s.hasPrint" />

        <ThePlayer v-if="s.type === 'audio'" :currentIndex="s.currentIndex" />

        <TheOptRevert v-if="s.type === 'items'" />
      </template>
    </AppSlider>

    <template slot="frame">
      <span style="position:relative; color:red;">TheSamples [{{ this.s.currentIndex }}] of {{ this.s.samples.length }}</span>
    </template>
  </AppFrame>
</template>

<script>
import AppFrame  from '~/components/AppFrame';
import AppSlider from '~/components/AppSlider';

import TheOptRulers from '~/components/TheOptRulers';
import TheOptPrint  from '~/components/TheOptPrint';
import TheOptRevert from '~/components/TheOptRevert';
import TheNav       from '~/components/TheNav';
import ThePlayer    from '~/components/ThePlayer';

import settings from '~/assets/settings';

import { mapGetters } from 'vuex';

export default {
  components: {
    AppFrame,
    AppSlider,
    TheOptRulers,
    TheOptPrint,
    TheOptRevert, // TODO: temporary
    TheNav,
    ThePlayer,
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
  width: 50%;
  height: 50vh;
  outline: 1px solid red;
  z-index: 999;
}

</style>
