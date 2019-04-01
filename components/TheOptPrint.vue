<template>
  <aside class="the-opt-print controls sidebar floating">
    <button class="btn btn-opt print ltr" tabindex="0" :disabled="!$store.getters.isSamplesShown" title="print page" @click="print" @blur="onAfterPrint">
      <SvgIcon view="28" :d="btnPrintPath" />
    </button>
    <img class="thumbnail" @load="onLoad" @error="onError" />
  </aside>
</template>

<script>
import SvgIcon from './SvgIcon';

export default {
  components: {
    SvgIcon,
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    $_i() {
      return this.$store.state.item;
    },

    btnPrintPath() {
      // <https://codepen.io/livelysalt/pen/Emwzdj>
      return 'M6,2 h16 v24 h-16 v-24 h2 v22 h12 v-20 h-14z' +
        'M6,20 h-4 v-12 h24 v12 h-5 v-5 h-14 v-4 h-3 v2 h3' +
        'M10,17 v1 h8 v-1z m0,2 v1 h8 v-1z m0,2 v1 h8 v-1z' +
        'M5,11 h1';
    },

  }, // computed {}

  mounted() {
    // [2018-07] Edge needs printout <img> to be near the root of the document to simplify setting width:100%
    window.$('body').append('<div id="printout"><img /></div>');
    window.$('#printout img').on('load', function(){ window.print() });
    window.onafterprint = this.onAfterPrint;
  },

  //====================================================================================================================

  watch: {
    $route() {
      this.onAfterPrintCleanup();
    }
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    print() {
      if (!this.$_i.isPrinting) {
        this.$store.commit('item/set', {isPrinting: true});
        const src = this.$store.getters['item/imageSrc'](this.$_i.samples[this.$_i.currentIndex], 200);
        window.$(this.$el).find('.thumbnail').attr('src', src);
      } else {
        this.onAfterPrint();
      }
    }, // print()

    //------------------------------------------------------------------------------------------------------------------

    onLoad(e) {
      if (this.$_i.isPrinting) window.$('#printout').addClass('is-printing').find('img').attr('src', e.target.src);
    }, // onLoad()

    //------------------------------------------------------------------------------------------------------------------

    onError() {
      this.$store.dispatch('alert', {msg: 'Print error: unable to load file.'});
    }, // onError()

    //------------------------------------------------------------------------------------------------------------------

    onAfterPrint() {
      window.$(this.$el).find('.thumbnail').removeAttr('src');
      window.$('#printout').removeClass('is-printing');
      this.$store.commit('item/set', {isPrinting: false});
    }, // onAfterPrint()

    //------------------------------------------------------------------------------------------------------------------

    onAfterPrintCleanup() {
      // delayed until route change because some browsers fire onafterprint() immediately, before print dialog is closed
      window.$('#printout').find('img').removeAttr('src');
    }, // onAfterPrintCleanup()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
@import "../assets/settings.scss";

.slider-frame:not(.has-print) .the-opt-print {
  display: none;

}

.the-opt-print {
  z-index: $layer-the-navbar - 1;
  top: 1em !important;
  right: (1em + $unit + 1em) !important;
  width: $unit;

  @media screen and (max-width: 350px) {
    top: (1em + $unit + 1em) !important;
    right: 1em !important;
  }
}

.btn-opt.print::after {
  z-index: -1;
  content: '';
  @include absolute-center();
  width: 100%;
  height: 100%;
  border-radius: 50%;
  @include short-transition;

  @at-root .is-printing & {
    background-color: $btn-toggle-bg-color;
    animation: a-btn-printing 2.0s infinite ease-in-out;
  }
}

@keyframes a-btn-printing {
  from {
    // [2018-07] Edge will only animate translation with absolute (px) values
    transform: translate(-20px, -20px) scale(0);
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

.thumbnail {
  pointer-events: none;
  opacity: 0;
  @include absolute-center(x);
  top: calc(50% + 1px);
  width: 14px;
  min-height: 100%;
  box-sizing: content-box;
  border: 1px solid transparent;
  transform: translateX(-50%) perspective(20em) rotate3d(1, 0, 0, 90deg);
  transform-origin: top center;
  @include short-transition;

  @at-root .is-printing & {
    transform: translateX(-50%) perspective(20em) rotate3d(1, 0, 0, 0deg);
    opacity: 1;
    top: calc(100% + 1em);
    width: 100%;
    border-color: white;
    background-color: white;
    @include drop-shadow;
  }
}

@media screen {
  #printout {
    display: none !important;
  }
} // @screen

@media print {

  html {
    background: unset !important;
  }

  #printout.is-printing::before {
    position: absolute;
    z-index: 1;
    content: 'Copyrighted Material. Use for evaluation purposes only. Printout may not be actual size.';
    width: 100%;
    text-align: center;
    text-decoration: underline;
    font-style: italic;
    font-size: 10pt;
    text-shadow: -1px -1px 0 white, 1px -1px 0 white, 1px 1px 0 white, -1px 1px 0 white;
  }

  #printout img {
    width: 100% !important;
  }

  body > *:not(#printout) {
    display: none !important;
  }

} // @print

</style>
