<template>
  <aside class="the-opt-print controls sidebar floating">
    <button class="btn btn-opt print ltr" tabindex="1" title="print page" @click="print">
      <SvgIcon view="28" :d="btnPrintPath" />
    </button>
    <iframe id="print" :src="srcPrint" @load="onLoad($event)"></iframe>
  </aside>
</template>

<script>
import SvgIcon from './SvgIcon';

export default {
  components: {
    SvgIcon,
  },

  data() {
    return {
      srcPrint: '',
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },

    btnPrintPath() {
      // <https://codepen.io/livelysalt/pen/Emwzdj>
      return 'M6,2 h16 v24 h-16 v-24 h2 v22 h12 v-20 h-14z' +
        'M6,20 h-4 v-12 h24 v12 h-5 v-5 h-14 v-4 h-3 v2 h3' +
        'M10,17 v1 h8 v-1z m0,2 v1 h8 v-1z m0,2 v1 h8 v-1z' +
        'M5,11 h1';
    },

  }, // computed {}

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    print() {
      this.$store.commit('set', {isPrinting: !this.s.isPrinting});
      this.srcPrint = this.$store.getters.imageSrc(this.s.samples[this.s.currentIndex], 200);
      console.log('print!', this.$store.getters.imageSrc(this.s.samples[this.s.currentIndex], 200));
    }, // print()

    //------------------------------------------------------------------------------------------------------------------

    onLoad(event) {
      if (!this.srcPrint || !this.s.isPrinting) return;
      console.log('onLoad()', `srcPrint:${this.srcPrint}`, event.target);
      event.target.contentWindow.print();
      this.$store.commit('set', {isPrinting: false});
    }, // onLoad()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
@import "../assets/settings.scss";

.the-opt-print {
  z-index: $layer-the-nav - 1;
  top: 1em !important;
  left: (1em + $unit + 1em) !important;
  width: $unit;
}

.btn-opt.print::after {
  content: '';
  @include absolute-center();
  width: 100%;
  height: 100%;
  border-radius: 50%;
  @include short-transition;

  @at-root .is-printing & {
    background-color: $btn-toggle-bg-color;
    animation: a-printing 2.0s infinite ease-in-out;
  }
}

@keyframes a-printing {
  from {
    transform: translate(-50%, -50%) scale(0);
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
}

#print {
  pointer-events: none;
  opacity: 0;
  width: 100%;
  height: 100%;
}

</style>
