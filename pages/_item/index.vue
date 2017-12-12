<template>
  <aside class="audio-player">
    <div class="controls">
      <button class="btn-play" tabindex="2">
        <svg class="icon-play" width="28" viewBox="0 0 28 28"><path d="M6,2 l 21,12 -21,12 z"></path></svg>
        <svg class="icon-pause" width="28" viewBox="0 0 28 28"><path d="M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24 z"></path></svg>
      </button>
      <a class="prev" href="#">Prev</a>
      <a class="next" href="#">Next</a>
    </div>
    <div class="bar-progress">
      <div class="bar-seek">
        <div class="bar-play">
          <a href="#handle" class="bar-handle" tabindex="1"></a>
        </div>
      </div>
    </div>
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
$unit: 4.8em;
$player-bg-color: white;
$color: black;
$focus-color: hsla(30,100%,50%,1);

.audio-player {
  position: relative;
  font: $base-size/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  background-color: $player-bg-color;
  box-sizing: border-box;
  font-size: $base-size;
  height: 4.8em;
  padding: 0.4em;
}

.audio-player * {
  position: absolute;
}
.audio-player :focus {
  outline: none;
}

button {
  background: none;
  border: none;
  padding: 0;
}

.btn-play {
  left: 0;
  top: 0;
  box-sizing: content-box;
  width: 4em;
  height: 4em;
  overflow: hidden;
  border-radius: 50%;
  cursor: pointer;
  color: $color;
  transition: all .2s ease;
}
.btn-play:focus,
.btn-play:hover {
  color: $focus-color;
}
.btn-play svg {
  left: 0;
  top: 0;
  fill: currentColor;
  margin: .6em;
}

$progress_height: 4px;

.bar-progress {
  left: 1.5 * $unit;
  right: .5 * $unit;
  background-color: lighten($color, 90%);
  height: $progress_height;
  top: calc(50% - #{$progress_height}/2);
}

.bar-seek {
  height: 100%;
  width: 50%;
  box-sizing: content-box;
  cursor: pointer;
  background-color: lighten($color, 50%);
}

.bar-seek::before {
  display: inherit;
  width: 100%;
  top: -.8em;
  height: 2em;
  transition: all .2s ease;
}

.bar-play {
  height: 100%;
  width: 50%;
  box-sizing: content-box;
  border-right: 1px solid $player-bg-color;
  cursor: pointer;
  background-color: $focus-color;
}

.bar-handle {
  right: 0;
  top: 50%;
  height: 0;
  background-color: inherit;
}

.bar-handle::before,
.bar-handle::after {
  background-color: inherit;
  border-radius: 50%;
  cursor: ew-resize;
  opacity: 0;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transition: all .2s ease;
}

.bar-seek::before,
.bar-handle::before,
.bar-handle::after {
  content: "";
  position: inherit;
}

.bar-handle:hover::before,
.bar-handle:focus::before {
  opacity: .5;
  left: -1.5em;
  top: -1.5em;
  width: 3em;
  height: 3em;
}

.bar-seek:hover .bar-handle::after,
.bar-handle:focus::after {
  opacity: 1;
  left: -.8em;
  top: -.8em;
  width: 1.6em;
  height: 1.6em;
}
</style>
