<template>
  <aside class="the-opt-context controls sidebar floating">
    <div class="axis-x"><div class="axis-y">
      <button v-if="img" class="btn btn-opt btn-context ltr" :style="buttonStyle" title="product info..." tabindex="1" @click="showContext">
        <img class="img-context" :src="imageSrc" />
      </button>
    </div></div>
  </aside>
</template>

<script>
import settings from '~/assets/settings';

import mixins    from '~/plugins/mixins.vue';
import nextFrame from '~/plugins/nextFrame';
import sleep from '~/plugins/sleep';

import { mapMutations } from 'vuex';

export default {

  //--------------------------------------------------------------------------------------------------------------------

  props: {
    img: null,
  },

  computed: {
    $_() {
      return this.$store.state;
    },
    $_i() {
      return this.$store.state.item;
    },
    $_s() {
      return this.$store.state.series;
    },

    wRatio() {
      return this.img.w / settings.CONTEXT_MIN_WIDTH;
    },

    buttonStyle() {
      return `height: ${Math.floor(10 * this.img.h / this.wRatio) / 10}px`; // round down to 1/10th to avoid showing gap between drop shadow and image
    },

    imageSrc() {
      return `${this.$_.urlBaseImg}${this.img.file}`;
    },
  }, // computed {}

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

    async showContext() {

      const $slide = window.$(`#the-context .slide[data-index="${this.$_s.currentIndex}"]`);
      const slideS = $slide[0].getBoundingClientRect();
      const $opt   = window.$('#the-samples .the-opt-context');
      const $btn   = $opt.find('.btn');
      const $sliderPane = window.$('#the-samples .slider-pane');
      const slideI = $btn[0].getBoundingClientRect();

      const ratio = (slideS.width  / slideI.width);

      const xOffset = (slideS.left + (slideS.width / 2)) - (slideI.left + (slideI.width / 2));
      const yOffset = (slideS.top + (slideS.height / 2)) - (slideI.top + (slideI.height / 2));

      this.uiStateClass({add:'--xing samples-to-context samples-to-context-setup'});

      await nextFrame();

      this.uiStateClass({remove:'samples-to-context-setup', add:'samples-to-context-active', show:'context'});

      await nextFrame();

      $opt.find('.axis-x').css({'transform': `translateX(${xOffset}px)`});
      $opt.find('.axis-y').css({'transform': `translateY(${yOffset}px)`});
      $btn.css({'transform': `scale(${ratio})`, 'box-shadow': `0 0 ${1 / ratio}em transparent`});

      await sleep(settings.TRANSITION_TIME_CONTEXT_MS);

      $sliderPane.css({'transition':'none'});

      this.uiStateClass({remove:'--xing samples-to-context samples-to-context-active'});

      await nextFrame();

      $opt.find('.axis-x').css({'transform': null});
      $opt.find('.axis-y').css({'transform': null});
      $btn.css({'transform': null, 'box-shadow': null});

      await nextFrame();

      $sliderPane.css({'transition': null});

    }, // showContext()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
//----------------------------------------------------------------------------------------------------------------------
// TRANSITION
@import "../assets/settings.scss";

.samples-to-context #the-samples .slider-frame > *:not(.slider-pane),
.samples-to-context #the-samples .slider-pane > *:not(.the-opt-context) {
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity $transition-time-ms ease-out;
}
/*
.samples-to-context-active #the-samples .slider-frame > *:not(.slider-pane),
.samples-to-context-active #the-samples .slider-pane > *:not(.the-opt-context) {
  transition: opacity $transition-time-ms ease-out;
}
//*/

.show-samples:not(.context-to-samples) .the-opt-context,
.--xing .the-opt-context {
  opacity: 1 !important; // override scoped style
}

.samples-to-context .the-opt-context .axis-x {
  transition: transform $transition-time-context-ms ease-in-out;
}
.samples-to-context .the-opt-context .axis-y {
  transition: transform $transition-time-context-ms cubic-bezier(0.15, 0.75, 0.35, 1);
}

.samples-to-context #the-context {
  transition: opacity #{$transition-time-ms} ease-in-out #{$transition-time-context-ms - $transition-time-ms};
}

//----------------------------------------------------------------------------------------------------------------------
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-opt-context {
  z-index: $layer-the-nav - 1;
  top: 1em;
  left: 1em;
  width: $unit;
  // overwrite
  height: auto;
  box-shadow: none;
  background: transparent;
  opacity: 0;

  .btn {
    @include drop-shadow;
    // overwrite
    top: 0;
    transform: none;
  }

  img {
    left: 0;
    top: 0;
    width: 100%;
  }
}

</style>
