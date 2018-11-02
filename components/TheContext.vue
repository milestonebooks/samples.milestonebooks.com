<template>
  <aside v-if="currentIndex !== undefined" :class="['the-context shell',contextClass]" @click="toggleContext">

    <div class="slider">
      <div class="frame" :style="frameStyle">
        <div class="slides">
          <section v-for="item in series" :key="item.index" :data-index="item.index"
                   :class="`slide ${item.index === currentIndex ? 'current' : ''}`" :style="slideStyleSize(item)">
            <div class="slide-liner">
              <img v-if="item.image" :src="imageSrc(item)" draggable="false" @load="onImageLoaded(item.index, $event)" @error="onImageLoadError(item.index)" />
            </div>
          </section>
        </div>
      </div>
    </div>

    <div class="info"><div v-for="i of 20">Info-info-info-info</div></div>
  </aside>
</template>

<script>
  import settings from '~/assets/settings';

  import { mapMutations } from 'vuex';

  export default {
    components: {
    },

    props: {
      series: Array,
      currentIndex: Number,
    },

    data () {
      return {
        isLoaded:     false,
        minW:         settings.CONTEXT_MIN_WIDTH,
        show:         true,
        windowWidth:  window.innerWidth,
        availWidth:   document.documentElement.clientWidth,
        availHeight:  document.documentElement.clientHeight,
      }
    },

    //--------------------------------------------------------------------------------------------------------------------

    computed: {
      s() {
        return this.$store.state;
      },

      contextClass() {
        return {
          'is-debug': this.s._debugCheck, // TODO
          'is-init':  this.isLoaded,
        }
      },

      /*
      styleY() {
        if (this.show) return false;
        const c = this.s.context;
        const img = c.series[c.currentIndex].image;
        const scale = settings.CONTEXT_MIN_WIDTH / img.w;
        return {
          transform: `translateY(calc(-0% + 1em + ${Math.ceil(img.h / 2 * scale)}px))`, // TODO -%
        }
      },
      //*/

      frameStyle() {
        return {
          width: '100%',
          height: '100%',
          left: '50%',
          top: '50%',
        }
      },

    }, // computed {}

    //====================================================================================================================

    mounted() {
      window.addEventListener('resize', this.onResize);
    },

    beforeDestroy () {
      window.removeEventListener('resize', this.onResize);
    },

    //====================================================================================================================

    methods: {

      ...mapMutations([
        'set',
      ]),

      //------------------------------------------------------------------------------------------------------------------

      imageSrc(i) {
        return `${this.s.urlBaseImg}${i.image.file}`;
      }, // imageSrc()

      //------------------------------------------------------------------------------------------------------------------

      onImageLoaded(i, event) {
        this.isLoaded = true;
      }, // onImageLoaded()

      //------------------------------------------------------------------------------------------------------------------

      onImageLoadError(i) {
        this.$store.dispatch('alert', {msg: `Error: unable to load image [${i}].`});
      }, // onImageLoadError()

      //------------------------------------------------------------------------------------------------------------------

      slideStyleSize() {
        const img = this.s.context.series[this.s.context.currentIndex].image;
        //const x = (!this.show ? settings.CONTEXT_MIN_WIDTH / img.w : 1) * (img.wScale || 1);
        const x = (img.wScale || 1);
        return {
          width:  `${Math.ceil(img.w * x)}px`,
          height: `${Math.ceil(img.h * x)}px`,
        };
      }, // slideStyleSize()

      //------------------------------------------------------------------------------------------------------------------

      toggleContext() {

        if (this.s.isContexting) return;

        this.set({isContexting: true});

        this.show = !this.s.showContext;

        if (this.show) this.set({showContext: true});

        window.$(this.$el).toggleClass('show', this.show).toggleClass('hide', !this.show);

        // this triggers fading at the right time
        setTimeout(() => {
          if (!this.show) this.set({showContext: false});
        }, settings.TRANSITION_TIME_CONTEXT_MS - settings.TRANSITION_TIME_MS);

        this.set({isContexting: false});

      }, // toggleContext()

      //------------------------------------------------------------------------------------------------------------------
      // adapted from TheSlider.vue

      onResize() {
        this.windowWidth = window.innerWidth;
        this.availWidth  = document.documentElement.clientWidth;
        this.availHeight = document.documentElement.clientHeight;

        // delay autosize() until above settings are propagated in layout

        clearTimeout(window._resizeTC);

        window._resizeTC = setTimeout(async () => {
          this.autosize({resize:true});
        }, settings.TRANSITION_TIME_MS);

      }, // onResize()

      //------------------------------------------------------------------------------------------------------------------
      // adapted from TheSlider.vue

      autosize({resize = false} = {}) {
        return true;
        const index = this.currentIndex;

        const $slider = window.$('.the-context .slider');
        const $frame  = $slider.find(`.frame.dpi${dpi}`);
        const $slides = $frame.find('.slides');
        const $slide  = $slides.find(`.slide[data-index="${index}"]`);

        const height = Math.ceil($slide.height());
        const width  = Math.ceil($slide.width());

        const $slidePrev = $slide.prev();
        const $slideNext = $slide.next();

      }, // autosize()

      //------------------------------------------------------------------------------------------------------------------

    }, // methods{}

    //====================================================================================================================

  };
</script>

<style lang="scss">
.show-context main > *:not(.the-context) {
  opacity: 0;
  pointer-events: none;
}
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";
@import "../assets/slider.scss";

$slider-height: 75%;

main > *:not(.the-context) {
  @include short-transition;

  /*
  @at-root .show-context & {
    opacity: 0;
    pointer-events: none;
  }
  //*/
}

#{$isIE} .the-context {
  display: none; // [2018-10] not worth the effort
}

// transition timing is calibrated to produce an arc emphasizing horizontal movement 'rtl' or 'ltr' <https://uxdesign.cc/the-ultimate-guide-to-proper-use-of-animation-in-ux-10bd98614fa9>
.the-context {
  //pointer-events: none;
  z-index: $layer-the-context;
  width: 50%; // TODO

  &:not(.is-init) {
    opacity: 0;
  }

  /*
  transition: all .2s ease-in-out, transform .4s ease-in-out;
  &:not(.show) {
    //transform: translateX(calc(-0% + 3em)); // TODO -%
  }
  &.hide {
    transition: transform .3s ease-in-out;
  }

  .context-y {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    transition: all .25s ease-in-out, transform .3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }
  &.hide .context-y {
    transition: transform .3s cubic-bezier(0.645, 0.045, 0.355, 1) .1s;
  }

  &.show .slider {
    pointer-events: all;
  }
  //*/

  .slider {
    width: 100%;
    height: $slider-height;
  }

  .slides {
    cursor: default; // TODO
  }

  // icons sourced from <https://codepen.io/livelysalt/pen/Emwzdj> encoded via <https://yoksel.github.io/url-encoder/>
  // [2018-10] svg cursor only works in Chrome and Firefox
  .slide {
    &.current {
      pointer-events: all;
      cursor: pointer;
      //box-shadow: 0 0 1em transparentize(darken($background-color, 50%), .5);
      @include drop-shadow;

      @at-root .show-context & {
        cursor: zoom-in;
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cline x1='22' y1='22' x2='29' y2='29' stroke='#{$theme-color-data-uri}' stroke-width='5' stroke-linecap='round' /%3E%3Ccircle cx='13' cy='13' r='11' fill='white' stroke='#{$theme-color-data-uri}' stroke-width='3' /%3E%3Cpath d='M 7,13 a 8 8 0 0 1 6,-6' stroke='#{$theme-color-data-uri}' stroke-width='2' stroke-linecap='round' fill='none' /%3E%3C/svg%3E") 13 13, zoom-in;
        box-shadow: 0 0 1em transparentize(darken($background-color, 25%), .5);
        @include short-transition;

        &:hover {
          box-shadow: 0 0 1.5em transparentize(darken($background-color, 50%), .5);
        }
      }
    }

    img {
      width: 100%;
      height: 100%;
      transition: all .4s ease-in-out;
    }
  } // .slide

  .info {
    position: absolute;
    top: $slider-height;
    width: 100%;
    background: white;
    @include drop-shadow;
  } // .info

} // .the-context

</style>
