<template>
  <AppFrame id="the-context">
    <AppSlider type="series" slot="view"
               :slides="$_s.items" :currentIndex="$_s.currentIndex" :isLoading="$_s.isLoading"
               v-bind="{imageSrc, onImageLoaded, onImageLoadError}"></AppSlider>

    <template slot="frame">
      <div class="info" style="color:orange; font-size: 5em;"><div v-for="i of 20">Info-info-info-info</div></div>
    </template>
  </AppFrame>
</template>

<script>
import AppFrame  from '~/components/AppFrame';
import AppSlider from '~/components/AppSlider';

export default {
  components: {
    AppFrame,
    AppSlider,
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    $_() {
      return this.$store.state;
    },
    $_s() {
      return this.$store.state.series;
    },
  }, // computed {}

  mounted() {
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    imageSrc(slide) {
      return `${this.$_.urlBaseImg}${slide.image.file}`;
    }, // imageSrc()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoaded(i) {
      this.isLoaded = true; // TODO
    }, // onImageLoaded()

    //------------------------------------------------------------------------------------------------------------------

    onImageLoadError(i) {
      this.$store.dispatch('alert', {msg: `Error: unable to load image [${i}].`});
    }, // onImageLoadError()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

$slider-height: 75%;

#the-context /deep/ .app-view {
  height: calc(#{$slider-height} - 20px);
  margin-top: 10px;
}

#the-context /deep/ .slider-view {
  overflow: hidden;
}

//----------------------------------------------------------------------------------------------------------------------

.info {
  position: absolute;
  top: $slider-height;
  width: 100%;
  background: white;
  @include drop-shadow;
}

</style>
