<template>
  <aside id="debugger">
    <input class="check" type="checkbox" v-model="_debugCheck" />
  </aside>
</template>

<script>

export default {

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },

    _debugCheck: {
      get() {
        return this.s._debugCheck;
      },
      set(_debugCheck) {
        this.$store.commit('set',{_debugCheck});
      }
    }
  }, // computed {}

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

#debugger {
  z-index: $layer-the-debugger;
  position: fixed;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;

  > * {
    pointer-events: all;
  }

  .check {
    position: absolute;
  }
}


</style>
