<template>
  <aside class="the-opt-rulers">

    <div class="controls">
      <button class="btn btn-opt rulers ltr" tabindex="1" :title="`${s.showRulers ? 'hide' : 'show'} rulers`" @click="toggleRulers">
        <SvgIcon view="28" :d="btnRulerPath" />
      </button>
    </div>

  </aside>
</template>

<script>
import SvgIcon from './SvgIcon';

export default {
  components: {
    SvgIcon,
  },

  data () {
    return {
    }
  }, // data()

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },

    btnRulerPath() {
      //*
      return 'M2,8 h24 v12 h-24 v-12' +
        'h2 v10 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2 v-2 h1 v2 h2 v-4 h1 v4 h2' +
        'v-8 h-22';
      /*/
      return 'M5,23 h4 v-14 h14 v-6 h2 v8 h-14 v14 h-8 v-22 h20 v2' +
        'h-1 v2 h-1 v-2 h-2 v1 h-1 v-1 h-2 v2 h-1 v-2 h-2 v1 h-1 v-1 h-2 v2 h-1 v-2 h-2 v1 h-1 v-1 h-1' +
        'v1 h1 v1 h-1 v2 h2 v1 h-2 v2 h1 v1 h-1 v2 h2 v1 h-2 v2 h1 v1 h-1 v2 h2 v1 h-2z';
      //*/
    },
  }, // computed {}

  //====================================================================================================================

  mounted() {
  }, // mounted ()

  watch: {
  },

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
  @include absolute-center(x, fixed); // `align-self: center` doesn't work with IE 11 and early iPhones
  left: calc(50% + #{$unit * 2.5});
  top: 0;
  box-sizing: border-box;
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow;
  height: $unit;
  width: $unit;

  * {
    position: absolute;
  }
  :focus {
    outline: none;
  }
}

.btn svg {
  width: 2.8em;
  height: 2.8em;
  fill: currentColor;
  @include absolute-center();
}

.show-rulers .btn-opt.rulers::after {
  content: '';
  @include absolute-center();
  width: 3.2em;
  height: 3.2em;
  box-sizing: border-box;
  border: 2px solid currentColor;
  border-radius: 3px;
}

</style>
