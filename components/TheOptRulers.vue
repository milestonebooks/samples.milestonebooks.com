<template>
  <aside class="the-opt-rulers controls sidebar floating">
    <button class="btn btn-opt rulers ltr" tabindex="1" :title="`${s.showRulers ? 'hide' : 'show'} rulers`" @click="toggleRulers">
      <SvgIcon view="28" :d="btnRulerPath" />
    </button>
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
    s() {
      return this.$store.state;
    },

    btnRulerPath() {
      // <https://codepen.io/livelysalt/pen/Emwzdj>
      return 'M2,8 h24 v12 h-24 v-12' +
        'h2 v10 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2' +
        'v-8 h-22';
    },
  }, // computed {}

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    toggleRulers() {
      this.$store.commit('set', {showRulers: !this.s.showRulers});
    }, // toggleRulers()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-opt-rulers {
  z-index: $layer-the-nav - 1;
  top: 1em;
  left: 1em;
  width: $unit;
}

.btn-opt.rulers::after {
  content: '';
  @include absolute-center();
  width: 3.2em;
  height: 3.2em;
  border-radius: 50%;
  @include short-transition;

  @at-root .show-rulers & {
    background-color: $btn-toggle-bg-color;
  }
}

</style>
