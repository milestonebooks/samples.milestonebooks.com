<template>
  <article :id="id" class="app-frame">
    <article class="app-view">
      <slot name="view"></slot>
    </article>
    <slot name="frame"></slot>
  </article>
</template>

<script>
export default {
  components: {
  },

  props: {
    id: String,
  },
}
</script>

<style lang="scss">
@import "../assets/settings.scss";

.app-frame {
  position: absolute;
  z-index: 1;
  width: 100%; // % instead of vw to avoid potential h scrollbar
  height: 100vh;
  overflow: auto;

  @at-root body:not(.is-resizing) & {
    @include short-transition;
  }
}

.app-view {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: $background-color;

  @at-root body:not(.is-resizing) & {
    @include short-transition;
  }
}

</style>
