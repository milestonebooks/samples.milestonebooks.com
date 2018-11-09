<template>
  <article :id="id" class="frame">
    <article class="view">
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

<style lang="scss" scoped>
@import "../assets/settings.scss";

.frame {
  position: absolute;
  width: 100%; // % instead of vw to avoid potential h scrollbar
  height: 100vh;
  overflow: hidden;
  @include short-transition;

  .view {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: auto;
    @include short-transition;
    background-color: hsla(0,100%,50%,.5);
  }

} // .frame
</style>
