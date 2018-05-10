<template>
  <aside :class="['audio-player', uiClass]">
    <div class="controls">
      <button class="btn-play" tabindex="1" :title="playTitle" @click="$store.commit('player/togglePlay')">
        <SvgIcon :width="28" :d="btnPlayPath"></SvgIcon>
      </button>
      <nuxt-link class="btn-prev opt-multi" :title="getSample(-1, 'title')" :disabled="!getSample(-1)" :to="'#' + getSample(-1, 'id')" replace tag="button">
        <SvgIcon :width="28" :scale=".5" :d="btnPrevPath"></SvgIcon>
      </nuxt-link>
      <button class="btn-list opt-multi" :title="listTitle" @click="toggleListShown">
        <SvgIcon :width="28" :scale=".5" :d="btnListPath"></SvgIcon>
      </button>
      <nuxt-link class="btn-next opt-multi" :title="getSample(+1, 'title')" :disabled="!getSample(+1)" :to="'#' + getSample(+1, 'id')" replace tag="button">
        <SvgIcon :width="28" :scale=".5" :d="btnNextPath"></SvgIcon>
      </nuxt-link>
    </div>
    <nav :class="{list: true, show: p.isListShown}">
      <ul>
        <li v-for="sample in $store.state.samples" :class="{item: true, sequential: sample.sequential, current: sample.index === p.current.index}" @click="onListClick(sample.index)">
          <div class="track"><span>{{ sample.id }}</span></div>
          <div class="title"><span>{{ sample.title }}</span></div>
        </li>
      </ul>
      <ul class="settings">
        <li><label><input type="checkbox" v-model="autoPlay" />autoplay</label></li>
        <li><label><input type="checkbox" v-model="autoNext" />autonext</label></li>
      </ul>
    </nav>
    <div class="bar-progress">
      <div class="bar-seek" :class="{captured: p.isCaptured}" :style="barSeekStyle" @mousedown="moveStart" @touchstart="moveStart">
        <div class="bar-play" :style="barPlayStyle">
          <a href="#" class="bar-handle" ref="handle" :style="barHandleStyle" tabindex="2" @keydown="onHandleKey" @click.prevent="">
            <span class="bar-tip" :title="handleTip"></span>
          </a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import { mapGetters, mapMutations } from 'vuex';

//import axios from 'axios';
import NuxtLink from '../.nuxt/components/nuxt-link'

export default {
  components: {
    NuxtLink,
    SvgIcon,
  },

  props: [
    'currentIndex',
  ],

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
      'isPlayable',
      'uiClass',
      'barSeekStyle',
      'barPlayStyle',
      'barHandleStyle',
      'playTitle',
      'handleTip',
    ]),
    s() {
      return this.$store.state;
    },
    p() {
      return this.$store.state.player;
    },
    btnPlayPath() {
      return (this.p.isPlaying ? 'M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24 z' : (this.isPlayable ? 'M6,2 l 21,12 -21,12' : ''));
    },
    btnPrevPath() {
      return 'M2,2 h4 v24 h-4z M26,2 l -18,12 18,12z';
    },
    btnNextPath() {
      return 'M2,2 l 18,12 -18,12z M22,2 h4 v24 h-4z';
    },
    btnListPath() {
      return 'M0,2 l 4,4 -4,4z m8,2 h18 v4 h-18z m0,8 h18 v4 h-18z m0,8 h18 v4 h-18z';
    },
    listTitle() {
      return 'Toggle List';
    },
    autoPlay: {
      get () {
        return this.p.isAutoPlay;
      },
      set (isAutoPlay) {
        this.$store.commit('player/set',{isAutoPlay})
      },
    },
    autoNext: {
      get () {
        return this.p.isAutoNext;
      },
      set (isAutoNext) {
        this.$store.commit('player/set',{isAutoNext})
      },
    },
  }, // computed {}

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof $ === 'undefined') return;
    this.bindEvents();
    this.$store.subscribeAction((action) => {
      if (action.type === 'player/onEnd' && this.p.isAutoNext && this.getSample(+1)) this.$router.replace('#' + this.getSample(+1, 'id'));
    });
    this.init();
  }, // mounted ()

  beforeDestroy() {
    this.unbindEvents();
  }, // beforeDestroy ()

  watch: {
    currentIndex: 'update',
  },

  //====================================================================================================================

  methods: {

    ...mapMutations('player',[
      'set',
      'setCurrent',
    ]),

    //------------------------------------------------------------------------------------------------------------------

    init() {
      this.$store.dispatch('player/initSettings');
      this.$slider = window.$(this.selSlider);
      this.set({isInit:true});
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
      //console.log('update() currentIndex:', this.currentIndex, this.$store.state.samples[this.currentIndex]);
      this.load(this.currentIndex);
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    async load(index) {
      await this.$store.dispatch('player/loadAudio', index).catch((err_code) => {
        this.$store.commit('set', {alert:`Error loading audio [${err_code}]`});
      });
      this.refresh();
    }, // load()

    //------------------------------------------------------------------------------------------------------------------

    getSample(dir = 0, key) {
      const i = this.s.currentIndex + dir;
      const sample = (this.s.samples[i] ? this.s.samples[i] : null);
      return sample && key ? sample[key] : sample;
    }, // getSample()

    //------------------------------------------------------------------------------------------------------------------

    onHandleKey(e) {
      // throttle
      if (this.keyActive) return;

      this.keyActive = true;

      setTimeout(() => {
        this.keyActive = false;
      }, 100);

      // see <https://stackoverflow.com/questions/8584902/get-closest-number-out-of-array>
      const getClosest = (num, arr) => {
        let closest = arr[0];
        for (const val of arr) {
          if (Math.abs(val - num) < Math.abs(num - closest)) closest = val;
        }
        return closest;
      }

      // adjust to the interval nearest 20th (5%) rounded to an interval:
      // 10s; 20s (len > 5m); 30s (>~8m); 1m (>15m); 5m (>1h); 10m (>2.5h)
      const len = this.p.current.duration;
      const intv = 20;
      const secIntv = getClosest(len / intv, [10, 20, 30, 60, 300, 600]);
      const pct = this.p.current.pct;

      let newPct = pct;

      switch (e.key) {
      case 'Backspace':
      case 'ArrowLeft':
        newPct = (Math.ceil( Math.round(len * pct / 100) / secIntv) - 1) * secIntv / len * 100; break;
      case 'ArrowRight':
        newPct = (Math.floor(Math.round(len * pct / 100) / secIntv) + 1) * secIntv / len * 100; break;
      case 'Home':
        newPct =   0; break;
      case 'End':
        newPct = 100; break;
      case 'Enter':
      case ' ': // duplicate play button behavior
        this.$store.commit('player/togglePlay',false); break;
      default:
        return; // ignore all other keys
      }

      if (newPct !== pct) {
        this.moveStart(e, newPct);
        this.moveEnd(e);
      }

      e.preventDefault();
    }, // onHandleKey()

    //------------------------------------------------------------------------------------------------------------------

    // adapted from <https://github.com/NightCatSama/vue-slider-component/blob/master/src/vue2-slider.vue>
    moveStart(e, pct) {
      e.preventDefault();
      this.minX = this.$slider.offset().left;
      this.moveCaptured = true;
      this.set({isCaptured: this.moveCaptured});
      this.moving(e, pct);
    }, // moveStart()

    //------------------------------------------------------------------------------------------------------------------

    moving(e, pct) {
      if (!this.moveCaptured) return false;
      e.preventDefault();

      if (pct === undefined) {

        if (e.targetTouches && e.targetTouches[0]) e = e.targetTouches[0];

        let x = e.pageX;
        const minX = this.minX;
        const maxX = minX + this.$slider.width(); // width could change (based on loading state) during drag

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;

        pct = ((x - minX) / (maxX - minX)) * 100;
      }

      this.$store.dispatch('player/setPctHandle', pct);
    }, // moving()

    //------------------------------------------------------------------------------------------------------------------

    moveEnd(/*e:unused*/) {
      if (!this.moveCaptured) return false;

      this.moveCaptured = false;
      this.set({isCaptured: this.moveCaptured});

      if (!this.p.isPlaying || this.p.interrupted) this.$store.commit('player/sync', {from:'handle'});

      this.$refs.handle.focus();
    }, // moveEnd()

    //------------------------------------------------------------------------------------------------------------------

    toggleListShown() {

      this.set({isListShown: !this.p.isListShown});

    }, // toggleListShown()

    //------------------------------------------------------------------------------------------------------------------

    onListClick(index) {
      this.toggleListShown();
      this.$router.replace('#' + this.s.samples[index].id);
    }, // onListClick()

    //------------------------------------------------------------------------------------------------------------------

    refresh() {
      this.setCurrent({pctPixel: 100 / this.$slider.width()});
    }, // refresh()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>

// adapted from <https://gist.github.com/tqc/2564280>
@function colorConvertAlpha($colorA, $colorB:white) {
  $hA: hue($colorA);
  $sA: saturation($colorA);
  $lA: lightness($colorA);
  $a: alpha($colorA);
  $hB: hue($colorB);
  $sB: saturation($colorB);
  $lB: lightness($colorB);
  $h: round(((1 - $a) * $hB) + ($a * $hA));
  $s: round(((1 - $a) * $sB) + ($a * $sA));
  $l: round(((1 - $a) * $lB) + ($a * $lA));
  @return hsl($h, $s, $l);
}

@function shortTransition() {
  @return all .2s ease;
}

$base-size: 10px;
$unit: 4em;
$player-bg-color: white;
$color: black;
$disabled-color: lighten($color, 90%);
$focus-color: hsla(22, 85%, 43%, 1);
$list-background-color: lighten($disabled-color, 5%);
$list-shadow: 0 0 1em transparentize(darken($disabled-color, 75%), .5);
$list-radius: .5em;

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
  transition: shortTransition();
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
  transition: shortTransition();
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
  margin: -.5 * $unit;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: $color;
  animation: a-scaleout 1.0s infinite ease-in-out;
}

@keyframes a-scaleout {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1.0);
    opacity: 0;
  }
}

.opt-multi {
  opacity: 0;
  right: 0;
  transition: shortTransition();
}
.is-multi .opt-multi {
  opacity: 1;
}

.is-multi .btn-prev {
  right: 2 * $unit;
}

.is-multi .btn-list {
  right: 1 * $unit;
}

.btn-prev,
.btn-next {
  z-index: 2; /* raise above .btn-list shadow */
}

.btn-list {
  z-index: 1; /* raise above list shadow */
  padding: 1em 1em 0 1em;
  transform: translateY(calc(-50% - .5em)) translateX(1em);
}

.btn-list::before {
  position: absolute;
  content: '';
  left: 50%;
  top: calc(50% + .5em);
  margin: -.5 * $unit;
  width: $unit;
  height: $unit;
  opacity: 0;
  border-radius: $list-radius $list-radius 0 0;
  background-color: $list-background-color;
  transition: shortTransition();
}

.btn-list svg {
  top: calc(50% + .5em);
}

.is-list-shown .btn-list::before {
  box-shadow: $list-shadow;
  opacity: 1;
}

.is-multi .btn-next {
  right: 0;
}

.list {
  pointer-events: none;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0em);
  padding: .5em;
  background-color: $list-background-color;
  box-shadow: $list-shadow;
  border-radius: $list-radius;
  opacity: 0;
  overflow: hidden;
  transition: shortTransition();
}

.list.show {
  pointer-events: all;
  opacity: 1;
}

.list * {
  position: relative;
}

.list ul, .list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.list .item {
  display: flex;
  align-items: center;
  height: 0;
  cursor: pointer;
  background-color: change-color($disabled-color, $lightness: 100%);
  transition: shortTransition();
}

.list.show .item {
  height: 1 * $unit;
  border-bottom: 1px solid $disabled-color;
}

.list .item:hover,
.list .item.current {
  background-color: white;
  color: $focus-color;
}

.list .item.current {
  cursor: default;
  font-weight: bold;
}

.list .item:not(.sequential) {
  margin-top: 1.5em;
  border-top: 1px solid $disabled-color;
}
.list .item:not(.sequential)::before {
  pointer-events: none;
  content: 'Some tracks omitted';
  position: absolute;
  bottom: calc(100% + 1px);
  line-height: 1.5em;
  padding-left: 6em;
  color: darken($disabled-color, 25%);
  font-weight: normal;
  font-style: italic;
}

.list .item > * {
  display: inline-block;
  box-sizing: border-box;
}

.list .item span {
  font-size: 1.8em;
}

.list .track {
  width: 1 * $unit;
  text-align: right;
  padding-right: .5em;
}

.list .title {
  margin-left: .5 * $unit;
  flex: 1;
}

.list .settings {
  padding: .5em 1.5em;
}

.list .settings li {
  display: inline-block;
}

.list .settings label {
  display: inline-block;
  font-size: 1.5em;
  padding: .5em 0;
  margin-right: 2em;
  cursor: pointer;
}

.list .settings input {
  vertical-align: middle;
  margin-right: .25em;
}

.bar-progress {
  left: 1.5 * $unit;
  right: .5 * $unit;
  background-color: $disabled-color;
  height: 4px;
  top: 50%;
  transform: translateY(-50%);
  transition: shortTransition();
}
.is-multi .bar-progress {
  right: 3.5 * $unit;
}

.bar-seek {
  height: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  box-sizing: content-box;
  cursor: pointer;
  background-color: lighten($color, 75%);
  transition: height .5s ease, background-color .5s ease;
}

.is-loading .bar-seek {
  background-color: $disabled-color;
}

.audio-player:not(.is-playable) .bar-seek {
  pointer-events: none;
}

.bar-seek::before { /* enables wider target zone */
  display: inherit;
  width: 100%;
  top: -.8em;
  height: 2em;
  transition: shortTransition();
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
  transition: shortTransition();
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
  background-color: colorConvertAlpha(transparentize($focus-color, .5));
  border: 0.2em solid white;
  border-radius: .5em;
  transition: shortTransition();
}

.bar-seek.captured .bar-tip,
.bar-handle:hover .bar-tip,
.bar-handle:focus .bar-tip {
  font-size: 11px;
  line-height: 11px;
  padding: .2em;
}

.bar-tip::after {
  content: attr(title);
}
</style>
