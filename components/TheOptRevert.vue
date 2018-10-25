<template>
  <a class="btn-opt revert" @click="revert">
      Revert to classic viewer
  </a>
</template>

<script>

export default {

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
  position: absolute;
  cursor: pointer;
  z-index: $layer-the-nav - 1;
  right: 1em;
  top: auto;
  bottom: 1em;
  width: auto;
  height: auto;
  color: blue;
  padding: 0.5em;
  background: white;
  border: 1px solid gray;

  &:hover {
    text-decoration: underline;
  }
}

</style>
