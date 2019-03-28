<template>
  <aside :class="`series-link ${dir} ${isDisabled ? 'disabled' : 'enabled'}`" :style="styleHeight">
    <button class="btn ltr" :title="getTitle" :aria-label="getLabel" tabindex="0" :disabled="isDisabled" @click="goTo">
      <span class="img-wrapper">
        <img class="img-series" :src="imageSrc" />
      </span>
    </button>
  </aside>
</template>

<script>
import settings  from '~/assets/settings';
import mixins    from '~/plugins/mixins.vue';
import nextFrame from '~/plugins/nextFrame';
import sleep     from '~/plugins/sleep';

import { mapGetters, mapMutations } from 'vuex';

export default {

  //--------------------------------------------------------------------------------------------------------------------

  props: {
    dir: String, // 'prev' | 'next'
    currentIndex: Number,
  },

  computed: {
    ...mapGetters({getSeriesSlide: 'series/getSlide'}),
    ...mapGetters({getItemSlide:   'item/getSlide'}),

    $_() {
      return this.$store.state;
    },
    $_i() {
      return this.$store.state.item;
    },
    $_s() {
      return this.$store.state.series;
    },

    slide() {
      return this.getSeriesSlide(this.dirIndex) || {};
    },

    dirIndex() {
      return this.dir === 'prev' ? -1 : +1;
    },

    getTitle() {
      return this.slide.title || null;
    },

    getLabel() {
      return `${this.dir === 'prev' ? 'previous' : 'next'} in series`;
    },

    isEnabled() {
      return this.$store.getters.isSamplesShown && !this.getItemSlide(this.dirIndex) && this.slide.code;
    },

    isDisabled() {
      return !this.isEnabled;
    },

    imageSrc() {
      return this.slide.image ? `${this.$_.urlBaseImg}${this.slide.image.file}` : null;
    },

    styleHeight() {
      return this.slide.image ? `height: ${Math.floor(this.slide.image.hRatio * 80)}px` : null; // pixel rounding provides smoother animation
    },
  }, // computed {}

  //====================================================================================================================

  methods: {
    ...mapMutations([
      'uiStateClass',
    ]),

    set: mixins.set,

    //------------------------------------------------------------------------------------------------------------------

    async goTo(e) {

      // TODO: calculations do not yet accommodate [data-dir="rtl"]

      const $btn = window.$(e.target).closest('.btn');
      const btn  = $btn[0].getBoundingClientRect();

      const $elSeriesOther  = window.$(`.series-link.${this.dir === 'prev' ? 'next' : 'prev'}`);
      const $elSamplesOther = window.$(`#the-samples .sidebar.${this.dir === 'prev' ? 'next' : 'prev'}`);
      const $samplesFrame   = window.$(`#the-samples .frame.dpi${this.$_i.dpi}`);
      const $navBtnList     = window.$('#the-samples .the-navbar .btn-list');
      const frame = window.$('#the-samples')[0].getBoundingClientRect();
      const slide = window.$(`#the-samples .slide[data-index="${this.$_i.currentIndex}"]`)[0].getBoundingClientRect();

      const toSamples = this.$_s.items[this.$_s.currentIndex + this.dirIndex].samples;

      if (!toSamples.length) console.log('no samples!'); // TODO

      const toImg = toSamples[this.dirIndex < 0 ? toSamples.length - 1 : 0].image;

      const wTo   = toImg ? toImg.w * this.$_i.dpi : slide.width;
      const hTo   = toImg ? toImg.h * this.$_i.dpi : slide.height;
      const wDiff = wTo - slide.width;

      // "slideTo" dimensions should be calculated here to avoid latency of waiting for AppSlider.vue->autosize()

      const slideTo = {
        left: slide.left - (wDiff / 2),
        top:  slide.top,
        width:  wTo,
        height: hTo,
      };

      if (slideTo.width > frame.width && this.$_i.dpi === settings.DPI_DEFAULT) {
        const wRatio = frame.width / slideTo.width;
        slideTo.width  = frame.width;
        slideTo.height = slideTo.height * wRatio;
        slideTo.left   = 0;
      }

      const yMargin = frame.height - slideTo.height;

      if (slideTo.top < 0 && slideTo.top + slideTo.height < frame.height) slideTo.top = frame.height - slideTo.height;
      if (slideTo.top > 0 && slideTo.top + slideTo.height > frame.height) slideTo.top = 0;
      if (yMargin > 0) slideTo.top = yMargin / 2;

      const btnRatio   = (slideTo.width / btn.width);
      const wScrollbar = (slideTo.height > frame.height ? this.$_.scrollbarWidth : 0);
      const xBtnOffset = (frame.width + (wScrollbar * this.dirIndex)) / 2 * (this.dirIndex * -1);
      const yBtnOffset = slideTo.top + (slideTo.height / 2) - (frame.height / 2);

      $btn[0].blur();

      const slideOutRatio = slide.width / settings.SERIES_BTN_WIDTH;
      const slideOutXOffset = (frame.width + (wScrollbar * this.dirIndex * -1)) / 2 * (this.dirIndex * -1);
      // translateX = frame.width / 2 +

      this.uiStateClass({add:`-xing -xing-${this.dir} samples-to-samples samples-to-samples-setup`});

      await nextFrame();

      this.uiStateClass({remove:'samples-to-samples-setup', add:'samples-to-samples-active samples-to-samples-out'});

      await nextFrame();

      //console.log('goTo() frame:', {w:frame.width, h:frame.height}, 'slide:', slide, 'to:', slideTo, 'slideOutRatio:', slideOutRatio);

      $btn.css({'transform': `translateX(${-50 * this.dirIndex * -1}%) translateY(-50%) translateX(${xBtnOffset}px) translateY(${yBtnOffset}px) scale(${btnRatio})`, 'box-shadow': `0 0 ${1 / btnRatio}em transparent`});
      $samplesFrame.css({'transition': `all ${settings.TRANSITION_TIME_CONTEXT_MS}ms ease-in-out`, 'transform-origin': `center ${frame.height / 2}px`, 'transform': `translateX(${slideOutXOffset}px) scale(${1 / slideOutRatio})`});
      $elSeriesOther.addClass('-xing-out'); // TODO should change to state-based
      $elSamplesOther.addClass('-xing-out');

      await sleep(settings.TRANSITION_TIME_CONTEXT_MS);

      this.uiStateClass({remove:'samples-to-samples-out', add:'samples-to-samples-in-setup'});

      await nextFrame();

      $btn.css({'transform': '', 'box-shadow': null}).parent().addClass('-xing-out'); // transform: `null` does not unset value in IE [2019-03-07]
      $samplesFrame.css({'transition': 'none', 'transform-origin': null, 'transform': 'none'});
      $navBtnList.addClass('no-transition');

      await nextFrame();

      const s = this.slide;
      const to = `/${s.code}/` + (this.dirIndex < 0 && s.samples.length > 1 ? `#${s.samples[s.samples.length - 1].id}` : '');
      this.$router.push(to);

      await nextFrame();

      this.uiStateClass({remove:'samples-to-samples-in-setup', add:'samples-to-samples-in'});

      await sleep(settings.TRANSITION_TIME_MS);

      this.uiStateClass({remove:`-xing -xing-${this.dir} samples-to-samples samples-to-samples-in samples-to-samples-active`});

      $btn.parent().removeClass('-xing-out');
      $elSeriesOther.removeClass('-xing-out');
      $elSamplesOther.removeClass('-xing-out');
      $samplesFrame.css({'transition': null});
      $navBtnList.removeClass('no-transition');

    }, // goTo()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
//----------------------------------------------------------------------------------------------------------------------
// TRANSITION
@import "../assets/settings.scss";

.series-links-pane {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.samples-to-samples .series-link {
  z-index: $layer-the-navbar + 1 !important;
}

.samples-to-samples-out.-xing-prev .series-link.prev .btn,
.samples-to-samples-out.-xing-next .series-link.next .btn {
  transition: all $transition-time-context-ms ease-in-out;
}

.samples-to-samples-out {
  .the-opt-context,
  .the-navbar .id-indicator-tray,
  #the-samples .slide:not(.current) {
    opacity: 0;
  }
}

.samples-to-samples-in-setup .the-navbar .id-indicator-tray {
  opacity: 0;
}

.samples-to-samples-in-setup .series-link .btn {
  transition: none !important;
}

//----------------------------------------------------------------------------------------------------------------------
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.series-link {
  pointer-events: all;
  z-index: $layer-the-navbar - 1;
  @include absolute-center(y);
  width: $unit;
  @include short-transition;

  &.disabled {
    pointer-events: none;
  }

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;

    & .btn {
      left: 0;
      transform: translateX(-50%) translateY(-50%);
    }
    &.disabled .btn,
    &.-xing-out .btn {
      transform: translateX(-50%) translateY(-50%) translateX(-50%);
    }
    @at-root .ui-state:not(.samples-to-samples) &:hover .btn {
      transform: translateX(-50%) translateY(-50%) translateX(10%);
    }
  }

  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;

    & .btn {
      right: 0;
      transform: translateX(50%) translateY(-50%);
    }
    &.disabled .btn,
    &.-xing-out .btn {
      transform: translateX(50%) translateY(-50%) translateX(50%);
    }
    @at-root .ui-state:not(.samples-to-samples) &:hover .btn {
      transform: translateX(50%) translateY(-50%) translateX(-10%);
    }
  }

  .btn {
    width: 2 * $unit;
    height: 100%;
    outline: none;

    @at-root .ui-state:not(.-xing) &:focus .img-wrapper::before {
      border-color: $focus-color;
    }
  }
  &.enabled:not(.-xing-out) .btn {
    @include drop-shadow;
  }

} // .series-link

</style>
