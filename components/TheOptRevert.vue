<template>
  <a class="btn-opt revert" @click="revert">
      Revert to classic viewer
  </a>
</template>

<script>

export default {

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

    revert() {
      if (window.ga) window.ga('send', 'event', 'version', 'old');
      window.location = `${window.location.pathname}?ver=old`;
    }, // toggleRulers()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.btn-opt.revert {
  cursor: pointer;
  z-index: $layer-the-nav - 1;
  right: 1em;
  top: auto;
  bottom: 1em;
  width: auto;
  height: auto;
  position: fixed;
  color: blue;
  padding: 0.5em;
  background: white;
  border: 1px solid gray;

  &:hover {
    text-decoration: underline;
  }
}

</style>
