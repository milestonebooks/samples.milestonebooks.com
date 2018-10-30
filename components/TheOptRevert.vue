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
  z-index: $layer-the-nav - 1;
  right: 1em;
  top: auto;
  bottom: 1em;
  width: auto;
  height: auto;
  padding: 0.5em;
  border: 1px solid gray;
  background: white;
  color: blue;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

</style>
