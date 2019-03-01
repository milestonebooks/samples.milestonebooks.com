<template>
  <AppFrame id="the-samples" :data-type="$_i.type">
    <AppSlider type="item" slot="view"
               :slides="$_i.samples" :currentIndex="$_i.currentIndex" :isLoading="$_i.isLoading" :defaultDpi="80" :zoomDpi="120"
               v-bind="{imageSrc, onImageLoaded, onImageLoadError}">

      <template slot="frame">
        <TheNav v-if="$_i.samples.length > 1" />
      </template>

      <template slot="pane">
        <TheOptContext :img="$_i.image" />

        <TheOptRulers v-if="$_i.hasRulers" />

        <TheOptPrint v-if="$_i.hasPrint" />

        <ThePlayer v-if="$_i.type === 'audio'" :currentIndex="$_i.currentIndex" />

        <TheOptRevert v-if="$_i.type === 'items'" />
      </template>
    </AppSlider>
  </AppFrame>
</template>

<script>
import AppFrame  from '~/components/AppFrame';
import AppSlider from '~/components/AppSlider';

import TheOptContext from '~/components/TheOptContext';
import TheOptRulers  from '~/components/TheOptRulers';
import TheOptPrint   from '~/components/TheOptPrint';
import TheOptRevert  from '~/components/TheOptRevert';
import TheNav        from '~/components/TheNav';
import ThePlayer     from '~/components/ThePlayer';

import settings from '~/assets/settings';

import { mapGetters } from 'vuex';

export default {
  components: {
    AppFrame,
    AppSlider,
    TheOptContext,
    TheOptRulers,
    TheOptPrint,
    TheOptRevert, // TODO: temporary
    TheNav,
    ThePlayer,
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters('item', [
      'imageSrc',
    ]),

    $_() {
      return this.$store.state;
    },

    $_i() {
      return this.$store.state.item;
    },
  }, // computed {}

  mounted() {
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    onImageLoaded(i, dpi, event) {
      this.$store.commit('item/setImageLoaded', {i, dpi});

      // use 80-dpi image as scaled background until 120-dpi image loads
      if (dpi === settings.DPI_DEFAULT && !this.$_i.samples[i].image.loaded[settings.DPI_ZOOM]) {
        // jQuery avoids throwing errors if no match found
        window.$(this.$el).find(`.frame.dpi120 [data-index="${i}"] img`).css({'background-image': `url("${event.target.src}")`});
      }
      // use 120-dpi image to avoid unnecessary downloads
      if (dpi === settings.DPI_ZOOM && !this.$_i.samples[i].image.loaded[settings.DPI_DEFAULT]) {
        this.$el.querySelector(`.frame.dpi80 [data-index="${i}"] img`).src = event.target.src;
      }
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoadError(i, dpi) {
      this.$store.commit('item/setImageLoaded', {i, dpi, loaded:false});
      this.$el.querySelector(`.frame.dpi${dpi} [data-index="${i}"] img`).removeAttribute('src');
    }, // onImageLoadError()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

</style>
