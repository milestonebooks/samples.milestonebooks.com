<template>
  <aside class="alerts" :data-length="s.alerts.length">
    <div v-for="alert in s.alerts" class="alert">{{alert}}</div>
  </aside>
</template>

<script>

export default {

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },
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

.alerts {
  z-index: $layer-alerts;
  pointer-events: none; // continue to allow interaction
  position: fixed;
  left: 0;
  top: 0;
  height: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  @include short-transition;
}
.alerts:not([data-length="0"]) {
  height: 100%;
}

.alert {
  position: relative;
  align-self: center;
  box-sizing: border-box;
  margin: .5em;
  border: 1px solid $alert-color;
  box-shadow: 0 .25em 1em #999;
  background-color: $alert-bg-color;
  font-size: 2rem;
  padding: .5em;
  min-width: 10em;
  max-width: 30em;
  @include short-transition;
}

</style>
