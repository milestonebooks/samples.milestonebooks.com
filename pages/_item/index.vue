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

<style scoped>
/*$base-size: 10px;*/

.audio-player {
  font: 10px/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  background-color: green;
  box-sizing: border-box;
  height: 26px;
  font-size: 24px;
  padding: 0.25em;
}
</style>
