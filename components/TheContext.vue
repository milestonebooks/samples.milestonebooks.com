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

<style lang="scss">
@import "../assets/settings.scss";

.show-context:not(.context-to-samples) #the-samples .slider-frame > *,
.show-context.context-to-samples       #the-samples .slider-frame > *:not(.slider-view) {
  z-index: 0;
  opacity: 0;
}
.context-to-samples-setup #the-samples .slide:not(.current) {
  transition: none;
  opacity: 0;
}
.context-to-samples-active #the-samples .slide:not(.current) {
  transition: opacity $transition-time-ms ease-in;
}

.context-to-samples-setup #the-samples .slider {
  transition: none;
}
.context-to-samples #the-context {
  transition: opacity $transition-time-ms ease-out;
}
.context-to-samples-active #the-context,
.show-samples #the-context {
  pointer-events: none;
  opacity: 0;
}
</style>

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
