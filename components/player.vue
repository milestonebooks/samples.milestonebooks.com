<template>
  <aside :class="['audio-player', uiClass]">
    <div class="controls">
      <button class="btn-play" tabindex="1" :title="playTitle" @click="$store.commit('player/onPlayClick')">
        <svg-icon :width="28" :d="btnPlayPath"></svg-icon>
      </button>
      <button class="btn-prev opt-multi" :title="prevTitle" :disabled="prevDisabled" @click="changeTrack(-1)">
        <svg-icon :width="28" :scale=".5" :d="btnPrevPath"></svg-icon>
      </button>
      <button class="btn-next opt-multi" :title="nextTitle" :disabled="nextDisabled" @click="changeTrack(+1)">
        <svg-icon :width="28" :scale=".5" :d="btnNextPath"></svg-icon>
      </button>
    </div>
    <div class="bar-progress">
      <div class="bar-seek" :class="{captured: $store.state.player.is_captured}" :style="barSeekStyle" @mousedown="moveStart" @touchstart="moveStart">
        <div class="bar-play" :style="barPlayStyle">
          <a href="#handle" class="bar-handle" ref="handle" :style="barHandleStyle" tabindex="2" @keydown="onKeyHandle">
            <span class="bar-tip" :title="handleTip"></span>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import SvgIcon from './svg-icon.vue';

import { mapGetters, mapMutations } from 'vuex';

import axios from 'axios';

export default {
  components: {
    SvgIcon,
  },

  data () {
    return {
      baseSize: '10px',
      selSlider: '.bar-seek',
      $slider: null,
      selHandle: '.bar-handle',
      moveCaptured: false,
      keyActive: false,
      minX: 0,
    }
  }, // data()

  computed: {
    ...mapGetters('player',[
      'uiClass',
      'barSeekStyle',
      'barPlayStyle',
      'barHandleStyle',
      'playTitle',
      'prevTitle',
      'nextTitle',
      'handleTip',
    ]),
    btnPlayPath() {
      let p = this.$store.state.player;
      return (p.is_playing ? 'M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24 z' : (p.is_loading || !p.current.track ? '' : 'M6,2 l 21,12 -21,12'));
    },
    btnPrevPath() {
      return 'M2,2 h4 v24 h-4z M26,2 l -18,12 18,12z';
    },
    btnNextPath() {
      return 'M2,2 l 18,12 -18,12z M22,2 h4 v24 h-4z';
    },
    prevDisabled() {
      let p = this.$store.state.player;
      return !p.current.track || p.current.track === p.min_track;
    },
    nextDisabled() {
      let p = this.$store.state.player;
      return !p.current.track || p.current.track === p.max_track;
    },
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

    ...mapMutations('player',[
      'set',
      'setCurrent',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.initAudioData();
      this.$slider = window.$(this.selSlider);
      this.set({is_init:true});
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
      console.log('update() route!', this.$route.params);
      this.loadTrack(this.$route.hash.replace(/\D/g,''));
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    async initAudioData() {
      console.log('is_init item:', this.$route);
      let res = await axios.get(`https://samples.milestonebooks.com/${this.$route.params.item}/?output=json`);
      this.set({title: res.data.title});
      this.set({item: this.$route.params.item});
      this.$store.commit('player/loadData', res.data);
      this.update();
    }, // initAudioData()

    //------------------------------------------------------------------------------------------------------------------

    async loadTrack(track) {
      await this.$store.dispatch('player/loadTrack', track).then(() => {
        this.refresh();
      });
    }, // loadTrack()

    //------------------------------------------------------------------------------------------------------------------

    changeTrack(dir = 1) {
      this.$router.push('#' + (this.$store.state.player.current.track + dir));
    }, // changeTrack()

    //------------------------------------------------------------------------------------------------------------------

    onKeyHandle(e) {
      // throttle
      if (this.keyActive) return;

      this.keyActive = true;

      setTimeout(() => {
        this.keyActive = false;
      }, 100);

      let pct = this.$store.state.player.current.pct;
      let newPct = pct;

      switch (e.key) {
        case 'Backspace':
        case 'ArrowLeft':
          newPct -= 5; break;
        case 'ArrowRight':
          newPct += 5; break;
        case 'Home':
          newPct = 0; break;
        case 'End':
          newPct = 100; break;
        case 'Enter':
        case ' ': // duplicate play button behavior
          this.$store.commit('player/onPlayClick',false); break;
        default:
          return; // ignore all other keys
      }

      if (newPct !== pct) {
        this.moveStart(e, newPct);
        this.moveEnd(e);
      }

      e.preventDefault();
    }, // onKeyHandle()

    //------------------------------------------------------------------------------------------------------------------

    // adapted from <https://github.com/NightCatSama/vue-slider-component/blob/master/src/vue2-slider.vue>
    moveStart(e, pct) {
      e.preventDefault();
      this.minX = this.$slider.offset().left;
      this.moveCaptured = true;
      this.set({is_captured: this.moveCaptured});
      this.moving(e, pct);
    }, // moveStart()

    //------------------------------------------------------------------------------------------------------------------

    moving(e, pct) {
      if (!this.moveCaptured) return false;
      e.preventDefault();

      if (pct === undefined) {

        if (e.targetTouches && e.targetTouches[0]) e = e.targetTouches[0];

        let x = e.pageX;
        let minX = this.minX;
        let maxX = minX + this.$slider.width(); // width could change (based on loading state) during drag

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;

        pct = ((x - minX) / (maxX - minX)) * 100;
      }

      this.$store.dispatch('player/setPctHandle', pct);
    }, // moving()

    //------------------------------------------------------------------------------------------------------------------

    moveEnd(e) {
      if (!this.moveCaptured) return false;

      this.moveCaptured = false;
      this.set({is_captured: this.moveCaptured});

      let p = this.$store.state.player;

      if (!p.is_playing || p.interrupted) this.$store.commit('player/sync', {from:'handle'});

      this.$refs.handle.focus();
    }, // moveEnd()

    //------------------------------------------------------------------------------------------------------------------

    refresh() {
      console.log('refresh() width', this.$slider.width());
      this.setCurrent({pctPixel: 100 / this.$slider.width()});
    }, // refresh()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
$base-size: 10px;
$unit: 4em;
$player-bg-color: white;
$color: black;
$disabled-color: lighten($color, 90%);
$focus-color: hsla(30,100%,50%,1);

.audio-player {
  position: relative;
  font: $base-size/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  background-color: $player-bg-color;
  box-sizing: border-box;
  font-size: $base-size;
  height: $unit;
}

.audio-player * {
  position: absolute;
}
.audio-player :focus {
  outline: none;
}

.audio-player:not(.is-multi) .opt-multi {
  opacity: 0;
  transition: all .2s ease;
}

.controls {
  width: 100%;
  height: 100%;
}

button {
  background: none;
  border: none;
  box-sizing: content-box;
  padding: 0;
  width: $unit;
  height: $unit;
  overflow: hidden;
  top: 50%;
  transform: translateY(-50%);
  transition: all .2s ease;
  color: $disabled-color;
}
button:not(:disabled) {
  cursor: pointer;
  color: $color;
}
button:not(:disabled):focus,
button:not(:disabled):hover {
  color: $focus-color;
}

button svg {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  fill: currentColor;
}

.audio-player:not(.is-init) .btn-play {
  opacity: 0;
}
.audio-player:not(.is-init) .btn-play,
.audio-player.is-loading .btn-play {
  cursor: wait;
}
.btn-play {
  left: 0;
  border-radius: 50%;
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

.btn-prev {
  right: 1 * $unit;
}

.btn-next {
  right: 0;
}

.bar-progress {
  left: 1.5 * $unit;
  right: .5 * $unit;
  background-color: $disabled-color;
  height: 4px;
  top: 50%;
  transform: translateY(-50%);
}
.is-multi .bar-progress {
  right: 2.5 * $unit;
}

.bar-seek {
  height: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  box-sizing: content-box;
  cursor: pointer;
  background-color: lighten($color, 50%);
  transition: height .5s ease, background-color .5s ease;
}

.is-loading .bar-seek {
  background-color: $disabled-color;
}

.bar-seek::before { /* enables wider target zone */
  display: inherit;
  width: 100%;
  top: -.8em;
  height: 2em;
  transition: all .2s ease;
}

.bar-play {
  height: 100%;
  width: 0;
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
  font-size: 0;
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
