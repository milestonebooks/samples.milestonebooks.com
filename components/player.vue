<template>
  <aside :class="['audio-player', ui_class]">
    <div class="controls">
      <button class="btn-play" tabindex="2" @click="$store.commit('player/onPlayClick')">
        <svg class="icon-play" width="28" viewBox="0 0 28 28"><path :d="btn_play_path"></path></svg>
      </button>
      <a class="prev" href="#">Prev</a>
      <a class="next" href="#">Next</a>
    </div>
    <div class="bar-progress">
      <div class="bar-seek" :class="{captured: $store.state.player.is_captured}" :style="bar_seek_style" @mousedown="moveStart" @touchstart="moveStart">
        <div class="bar-play" :style="bar_play_style">
          <a href="#handle" class="bar-handle" :style="bar_handle_style" tabindex="1">
            <span class="bar-tip" :title="$store.state.player.tip"></span>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import { mapGetters } from 'vuex';

import axios from 'axios';

export default {
  components: {
  },

  data () {
    return {
      selSlider: '.bar-seek',
      $slider: null,
      selHandle: '.bar-handle',
      moveCaptured: false,
      minX: 0,
    }
  }, // data()

  computed: {
    ...mapGetters({
      ui_class: 'player/ui_class',
      bar_seek_style:   'player/bar_seek_style',
      bar_play_style:   'player/bar_play_style',
      bar_handle_style: 'player/bar_handle_style',
    }),
    btn_play_path() {
      let p = this.$store.state.player;
      return (p.is_playing ? 'M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24 z' : (p.is_loading ? '' : 'M6,2 l 21,12 -21,12'));
    }
  }, // computed {}

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof $ === 'undefined') return;
    this.bindEvents();
    this.init();
  }, // mounted ()

  beforeDestroy() {
    this.unbindEvents();
  }, // beforeDestroy ()

  watch: {
    $route: 'update',
  },

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initAudioData();
      this.$slider = window.$(this.selSlider);
      this.refresh();
    }, // init()

    //------------------------------------------------------------------------------------------------------------------

    bindEvents() {
      document.addEventListener('touchmove',   this.moving, {passive: false});
      document.addEventListener('mousemove',   this.moving);
      document.addEventListener('touchend',    this.moveEnd, {passive: false});
      document.addEventListener('touchcancel', this.moveEnd, {passive: false});
      document.addEventListener('mouseup',     this.moveEnd);
      window.addEventListener('resize',        this.refresh);
    }, // bindEvents()

    //------------------------------------------------------------------------------------------------------------------

    unbindEvents() {
      document.removeEventListener('touchmove',   this.moving);
      document.removeEventListener('mousemove',   this.moving);
      document.removeEventListener('touchend',    this.moveEnd);
      document.removeEventListener('touchcancel', this.moveEnd);
      document.removeEventListener('mouseup',     this.moveEnd);
      window.removeEventListener('resize',        this.refresh)
    }, // unbindEvents()

    //------------------------------------------------------------------------------------------------------------------

    update() {
      console.log('update', this.$route.params);
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    async initAudioData() {
      console.log('init item:', this.$route);
      let res = await axios.get(`https://samples.milestonebooks.com/${this.$route.params.item}/?output=json`);
      this.$store.commit('setTitle', res.data.title);
      this.$store.commit('player/setItem', this.$route.params.item);
      this.$store.commit('player/loadData', res.data);
      this.$store.dispatch('player/loadTrack', +this.$route.hash.replace(/\D/g,''));
    }, // initAudioData()

    //------------------------------------------------------------------------------------------------------------------

    onPlay() {
      let p = this.$store.state.player;
      if (!p.is_playing) {
        this.$store.commit('player/play', window.howls[p.current.track].play(p.current.howlID));
      }
    }, // onPlay()

    //------------------------------------------------------------------------------------------------------------------

    // adapted from <https://github.com/NightCatSama/vue-slider-component/blob/master/src/vue2-slider.vue>
    moveStart(e) {
      e.preventDefault();
      this.minX = this.$slider.offset().left;
      this.moveCaptured = true;
      this.$store.commit('player/setCaptured', this.moveCaptured);
      this.moving(e);
    }, // moveStart()

    //------------------------------------------------------------------------------------------------------------------

    moving(e) {
      if (!this.moveCaptured) return false;
      e.preventDefault();

      if (e.targetTouches && e.targetTouches[0]) e = e.targetTouches[0];

      let x = e.pageX;
      let minX = this.minX;
      let maxX = minX + this.$slider.width(); // width could change (based on loading state) during drag

      if (x < minX) x = minX;
      if (x > maxX) x = maxX;

      let pct = ((x - minX) / (maxX - minX)) * 100;

      this.$store.dispatch('player/setPctHandle', pct);
    }, // moving()

    //------------------------------------------------------------------------------------------------------------------

    moveEnd(e) {
      if (!this.moveCaptured) return false;

      this.moveCaptured = false;
      this.$store.commit('player/setCaptured', this.moveCaptured);

      if (this.$store.state.player.interrupted) this.$store.commit('player/sync', {from:'handle'});
    }, // moveEnd()

    //------------------------------------------------------------------------------------------------------------------

    refresh() {
      this.$store.commit('player/setCurrent', {pctPixel: 100 / this.$slider.width()});
    }, // refresh()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
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

.is-loading .btn-play::before {
  position: absolute;
  content: '';
  left: 50%;
  top: 50%;
  margin: -2em;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: $color;
  animation: sk-scaleout 1.0s infinite ease-in-out;
}

@keyframes sk-scaleout {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1.0);
    opacity: 0;
  }
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
  width: 0%;
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
  width: 0%;
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
  cursor: ew-resize;
}

.bar-handle::before,
.bar-handle::after {
  background-color: inherit;
  border-radius: 50%;
  opacity: 0;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  transition: all .2s ease;
}

.bar-seek::before,
.bar-handle::before,
.bar-handle::after {
  content: "";
  position: inherit;
}

.bar-seek.captured .bar-handle::before,
.bar-handle:hover::before,
.bar-handle:focus::before {
  opacity: .5;
  width: 3em;
  height: 3em;
  transform: translate(-50%, -50%);
}

.bar-seek.captured .bar-handle::after,
.bar-seek:hover .bar-handle::after,
.bar-handle:focus::after {
  opacity: 1;
  width: 1.6em;
  height: 1.6em;
  transform: translate(-50%, -50%);
}

.bar-tip {
  font-family: Arial, serif;
  font-size: 0px;
  position: absolute;
  bottom: 0;
  transform: translate(-50%, -1.5em);
  color: black;
  background-color: transparentize($focus-color, .5);
  border-radius: .5em;
  transition: all .2s ease;
}

.bar-seek.captured .bar-tip,
.bar-handle:hover .bar-tip,
.bar-handle:focus .bar-tip {
  font-size: 11px;
  padding: .2em;
}

.bar-tip::after {
  content: attr(title);
}
</style>
