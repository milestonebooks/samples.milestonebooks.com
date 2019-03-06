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
  width: 100%; // % instead of vw to avoid potential h scrollbar
  height: 100vh;
  overflow: auto;
}

.app-view {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: auto;
}

</style>
