<template>
  <aside class="audio-player">
    Player
    <div class="controls">
      <button class="play">Play</button>
      <a class="prev" href="#">Prev</a>
      <a class="next" href="#">Next</a>
    </div>
    <div class="progress"></div>
  </aside>
</template>

<script>
// import Logo from '~/components/Logo.vue'

export default {
  components: {
//    Logo
  }
}
</script>

<style lang="scss" scoped>
$base-size: 10px;

.audio-player {
  font: $base-size/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  background-color: green;
  box-sizing: border-box;
  font-size: $base-size * 2.4;
  height: 26px;
  padding: 0.25em;
}
</style>
