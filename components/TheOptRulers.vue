<template>
  <aside class="the-opt-rulers">

    <div class="controls">
      <button class="btn btn-opt ltr" tabindex="1" title="rulers">
        <SvgIcon view="28">
          <path d="M3,3 v22 h21 v-6 h-15 v-15 h-6" stroke="black" stroke-width="2" fill="none" />
          <path d="M4,7 h2 m-2,3 h1 m-1,3 h2 m-2,3 h1 m-1,3 h2 m-2,3 h1
           M6,24 v-1 m3,1 v-2 m3,2 v-1 m3,1 v-2 m3,2 v-1 m3,1 v-2" stroke="black" fill="none" shape-rendering="crispEdges" />
        </SvgIcon>
      </button>
    </div>

  </aside>
</template>

<script>
import SvgIcon from './SvgIcon';

import settings from '~/assets/settings';

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
  }, // computed {}

  //====================================================================================================================

  mounted() {
  }, // mounted ()

  watch: {
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-opt-rulers {
  z-index: $layer-the-nav;
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

</style>
