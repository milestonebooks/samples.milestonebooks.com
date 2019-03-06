<template>
  <AppFrame id="the-context">
    <AppSlider type="series" slot="view"
               :slides="$_s.items" :currentIndex="$_s.currentIndex" :isLoading="$_s.isLoading" :marginY="10"
               v-bind="{imageSrc, onImageLoaded, onImageLoadError}"></AppSlider>

    <template slot="frame">
      <div class="info"><div class="info-liner">
        <h1 class="title">{{ $_i.title }}</h1>
      </div></div>
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
    $_i() {
      return this.$store.state.item;
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

$slider-height: 100%;//calc(100% - #{$info-visibility-height});

.samples-to-context #the-context {
  z-index: $layer-context-btn + 1;
}

#the-context /deep/ .app-view {
  height: $slider-height;
}

#the-context /deep/ .slider-view {
  overflow: hidden;
}

//----------------------------------------------------------------------------------------------------------------------

.info {
  position: absolute;
  top: 0;//$slider-height;
  //height: $info-visibility-height;
  width: 100%;

  .info-liner {
    box-sizing: border-box;
    height: 100%;
    padding: 10px;
    //background: white;
    //@include drop-shadow;
  }

  .title {
    margin: 0;
    text-align: center;
    font: normal 2em "Trebuchet MS", Helvetica, sans-serif;
    color: $theme-color;
  }
}

</style>
