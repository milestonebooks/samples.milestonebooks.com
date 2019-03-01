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

import mixins from '~/plugins/mixins.vue';
import sleep from '~/plugins/sleep';

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

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

    async showContext() {
      //console.log('showContext...');

      // ensure class is assigned to prepare transitions
      await sleep(1);

      this.set({uiStateShow: 'context'});
//return;

      const $slide = window.$(`#the-context .slide[data-index="${this.$_s.currentIndex}"]`);
      const slideS = $slide[0].getBoundingClientRect();
      const $opt   = window.$('#the-samples .the-opt-context');
      const $btn   = $opt.find('.btn');
      const slideI = $btn[0].getBoundingClientRect();

      const ratio = (slideS.width  / slideI.width);

      const xOffset = (slideS.left + (slideS.width / 2)) - (slideI.left + (slideI.width / 2));
      const yOffset = (slideS.top + (slideS.height / 2)) - (slideI.top + (slideI.height / 2));
      const XY = `${-xOffset}px, ${-yOffset}px`;

      $opt.find('.axis-x').css({'transform': `translateX(${xOffset}px)`});
      $opt.find('.axis-y').css({'transform': `translateY(${yOffset}px)`});
      $btn.css({'transform': `scale(${ratio})`, 'box-shadow': `0 0 ${1 / ratio}em transparent`});

      console.log('showContext... XY:', XY, ratio, slideS, slideI);

      setTimeout(async () => {
        this.set({isContexting: false});
        await sleep(1);
        $opt.find('.axis-x').css({'transform': null});
        $opt.find('.axis-y').css({'transform': null});
        $btn.css({'transform': null, 'box-shadow': null});
      }, settings.TRANSITION_TIME_CONTEXT_MS);

    }, // showContext()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

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

.show-samples:not(.context-to-samples) .the-opt-context {
  opacity: 1;
}

// TODO
.is-contexting .axis-x {
  transition: transform $transition-time-context-ms ease-in-out;
}
.is-contexting .axis-y {
  transition: transform $transition-time-context-ms cubic-bezier(0.15, 0.75, 0.35, 1);
}

</style>
