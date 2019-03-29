<template>
  <aside class="the-opt-context controls sidebar floating">
    <div class="axis-x"><div class="axis-y">
      <button class="btn btn-opt btn-context ltr" :style="buttonStyle" title="product info..." tabindex="0" :disabled="!$store.getters.isSamplesShown" @click="showContext">
        <span class="img-wrapper">
          <img class="img-context" :src="imageSrc" />
        </span>
      </button>
    </div></div>
  </aside>
</template>

<script>
import settings  from '~/assets/settings';
import mixins    from '~/plugins/mixins.vue';
import nextFrame from '~/plugins/nextFrame';
import sleep     from '~/plugins/sleep';

import { mapMutations } from 'vuex';

export default {

  //--------------------------------------------------------------------------------------------------------------------

  props: {
    img: {
      type: Object,
      default: {
        w: 0,
        h: 0,
      }
    },
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
      return this.img.w / settings.CONTEXT_BTN_WIDTH;
    },

    buttonStyle() {
      return `height: ${Math.floor(10 * this.img.h / this.wRatio) / 10}px`; // round down to 1/10th to avoid showing gap between drop shadow and image
    },

    imageSrc() {
      return this.img.file ? `${this.$_.urlBaseImg}${this.img.file}` : null;
    },
  }, // computed {}

  //====================================================================================================================

  watch: {
    '$_.request'() {
      if (this.$_.request === 'showContext') {
        this.showContext();
        this.$store.commit('set', {request: ''});
      }
    },
  },

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    addToHistory: mixins.addToHistory,

    //------------------------------------------------------------------------------------------------------------------

    async showContext() {

      this.$router.push(`/${this.$_i.code}/`);

      const $opt    = window.$('#the-samples .the-opt-context');
      const $btn    = $opt.find('.btn');
      const slideB  = $btn[0].getBoundingClientRect();

      const $slider = window.$('#the-samples .slider');
      const $slide  = window.$(`#the-context .slide[data-index="${this.$_s.currentIndex}"]`);
      const $slideI = window.$(`#the-samples .slide[data-index="${this.$_i.currentIndex}"]`);
      const slideS  = $slide[0].getBoundingClientRect(); // slide series
      const slideI  = ($slideI.length ? $slideI : $slide)[0].getBoundingClientRect(); // if there are no item samples, use series slide for slide item positioning

      const xRatio  = (slideI.width / slideS.width);
      const yRatio  = (slideI.height / slideS.height);
      const ratio   = Math.max(xRatio, yRatio);

      const xOffset = (slideS.left + (slideS.width  / 2)) - (slideI.left + (slideI.width  / 2));
      const yOffset = (slideS.top  + (slideS.height / 2)) - (slideI.top  + (slideI.height / 2));
      const ySlider = slideS.top + ((slideS.height / 2) + (yOffset / (ratio - 1)));

      const btnRatio   = (slideS.width  / slideB.width);
      const xBtnOffset = slideS.left - slideB.left;
      const yBtnOffset = slideS.top  - slideB.top;

      $btn[0].blur();

      this.uiStateClass({add:'-xing samples-to-context samples-to-context-setup'});

      await nextFrame();

      this.uiStateClass({remove:'samples-to-context-setup', add:'samples-to-context-active', show:'context'});

      await nextFrame();

      $slider.css({'transform-origin': `50% ${ySlider}px`, 'transform': `translateX(${xOffset}px) scale(${1 / ratio})`});
      $opt.find('.axis-x').css({'transform': `translateX(${xBtnOffset}px)`});
      $opt.find('.axis-y').css({'transform': `translateY(${yBtnOffset}px)`});
      $btn.css({'transform': `scale(${btnRatio})`, 'box-shadow': `0 0 ${1 / btnRatio}em transparent`});

      await sleep(settings.TRANSITION_TIME_CONTEXT_MS);

      this.uiStateClass({add:'samples-to-context-cleanup'});

      await sleep(settings.TRANSITION_TIME_MS);

      this.uiStateClass({remove:'-xing samples-to-context samples-to-context-active samples-to-context-cleanup'});

      await nextFrame();

      $slider.css({'transform-origin': null, 'transform': null});
      $opt.find('.axis-x').css({'transform': 'none'}); // `null` does not unset value in IE [2019-03-07]
      $opt.find('.axis-y').css({'transform': 'none'});
      $btn.css({'transform': null, 'box-shadow': null});

      await nextFrame();

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

.samples-to-context .the-opt-context {
  opacity: 1 !important; // override scoped style
  z-index: $layer-the-navbar + 1 !important;
}

.samples-to-context .the-opt-context {
  transition: transform $transition-time-context-ms linear;
}
.samples-to-context .the-opt-context .axis-x {
  transition: transform $transition-time-context-ms ease-in-out;
}
.samples-to-context .the-opt-context .axis-y {
  transition: transform $transition-time-context-ms cubic-bezier(0.2, 0.8, 0.5, 1);
}
.samples-to-context .the-opt-context .btn {
  transition: transform $transition-time-context-ms ease-in-out;
}
.samples-to-context .the-opt-context .img-wrapper {
  transition: opacity $transition-time-ms ease-in-out;
}
.samples-to-context-cleanup .the-opt-context,
.samples-to-context-cleanup .the-opt-context .img-wrapper {
  opacity: 0;
}

.samples-to-context #the-context {
  transition: opacity #{$transition-time-ms} ease-in-out #{$transition-time-context-ms - $transition-time-ms};
}
.samples-to-context #the-context .slide.current {
  transition: none;
}
.samples-to-context:not(.samples-to-context-cleanup) #the-context .slide.current {
  opacity: 0;
}

//----------------------------------------------------------------------------------------------------------------------
</style>

<style lang="scss">
@import "../assets/settings.scss";

.the-opt-context {
  z-index: $layer-context-btn;
  top: 1em;
  left: 1em;
  width: $unit;
  // overwrite
  height: auto !important;
  box-shadow: none !important;
  background: transparent !important;

  .btn {
    @include drop-shadow;
    transform-origin: left top;
    // overwrite
    top: 0;
    transform: none;

    @at-root .ui-state:not(.-xing) &:focus .img-wrapper::before {
      border-color: $focus-color;
    }
  }

  img {
    left: 0;
    top: 0;
  }
}

</style>
