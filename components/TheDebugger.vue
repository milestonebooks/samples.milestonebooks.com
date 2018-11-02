<template>
  <aside id="debugger" :data-debug="s._debugText">
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

<style lang="scss">
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

.debug [data-debug]::before {
  content: attr(data-debug);
  z-index: 9;
  position: fixed;
  top: 6rem;
  right: 0;
  font-size: 2em;
  outline: 1px solid red;
  background: hsla(0,100%,100%,.75);
}

</style>
