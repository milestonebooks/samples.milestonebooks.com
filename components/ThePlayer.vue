<template>
  <aside class="audio-player sidebar bottom h" :class="uiClass">

    <button class="btn btn-play ltr" :title="playTitle" @click.stop="$store.dispatch('player/togglePlay')">
      <SvgIcon view="28" :d="btnPlayPath"></SvgIcon>
    </button>

    <div class="bar-progress">
      <div class="bar-seek" :class="{captured: p.isCaptured}" :style="barSeekStyle" @mousedown="moveStart" @touchstart="moveStart">
        <div class="bar-play" :style="barPlayStyle">
          <a ref="handle" class="bar-handle" tabindex="0" :style="barHandleStyle" @keydown="onHandleKey" @click.prevent>
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

import settings from '~/assets/settings';

export default {
  components: {
    SvgIcon,
  },

  props: [
    'currentIndex',
  ],

  data () {
    return {
      selSlider: '.bar-seek',
      $slider: null,
      selHandle: '.bar-handle',
      moveCaptured: false,
      keyActive: false,
      minX: 0,
    }
  }, // data()

  computed: {
    ...mapGetters([
      'getSample',
      'listItemClass',
    ]),
    ...mapGetters('player',[
      'isPlayable',
      'uiClass',
      'barSeekStyle',
      'barPlayStyle',
      'barHandleStyle',
      'playTitle',
      'handleTip',
    ]),
    /*
    s() {
      return this.$store.state;
    },
    //*/
    p() {
      return this.$store.state.player;
    },
    btnPlayPath() {
      return (this.p.isPlaying ? 'M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24z' : (this.isPlayable ? 'M6,2 l 21,12 -21,12z' : ''));
    },
  }, // computed {}

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof $ === 'undefined') return;
    this.bindEvents();
    this.$store.subscribeAction((action) => {
      if (action.type === 'player/onEnd' && this.p.isAutoPlay && this.getSample(+1)) this.$router.replace('#' + this.getSample(+1, 'id'));
    });
    this.init();
  }, // mounted ()

  beforeDestroy() {
    this.unbindEvents();
  }, // beforeDestroy ()

  watch: {
    currentIndex() {
      this.update();
    },

    'p.isAutoPlay'() {
      this.$store.dispatch('player/togglePlay', {play: this.p.isAutoPlay});
    },
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
      this.$slider = window.$(this.$el).find(this.selSlider);
      this.set({isInit:true});
      this.refresh();
      this.update();
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
      this.load(this.currentIndex);
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    async load(index) {
      if (this.currentIndex === null) return;

      await this.$store.dispatch('player/loadAudio', index).catch((err_code) => {
        this.$root.error({statusCode:500, message:`Error loading audio #${index} [${err_code}]`});
      });
      this.refresh();
    }, // load()

    //------------------------------------------------------------------------------------------------------------------

    throttleKey(e) {
      if (this.keyActive) {
        e.preventDefault();
        return true;
      }

      this.keyActive = true;

      setTimeout(() => {
        this.keyActive = false;
      }, settings.TRANSITION_TIME_MS);
    }, // throttleKey()

    //------------------------------------------------------------------------------------------------------------------

    onHandleKey(e) {
      if (this.throttleKey(e)) return;

      // see <https://stackoverflow.com/questions/8584902/get-closest-number-out-of-array>
      const getClosest = (num, arr) => {
        let closest = arr[0];
        for (const val of arr) {
          if (Math.abs(val - num) < Math.abs(num - closest)) closest = val;
        }
        return closest;
      };

      // adjust to the interval nearest 20th (5%) rounded to an interval:
      // 10s; 20s (len > 5m); 30s (>~8m); 1m (>15m); 5m (>1h); 10m (>2.5h)
      const len = this.p.current.duration;
      const intv = 20;
      const secIntv = getClosest(len / intv, [10, 20, 30, 60, 300, 600]);
      const pct = this.p.current.pct;

      let newPct = pct;

      switch (e.key) {
      case 'Backspace':
      case 'ArrowLeft': case 'Left':
        newPct = (Math.ceil( Math.round(len * pct / 100) / secIntv) - 1) * secIntv / len * 100; break;
      case 'ArrowRight': case 'Right':
        newPct = (Math.floor(Math.round(len * pct / 100) / secIntv) + 1) * secIntv / len * 100; break;
      case 'Home':
        newPct =   0; break;
      case 'End':
        newPct = 100; break;
      case 'Enter':
      case ' ': // duplicate play button behavior
        this.$store.dispatch('player/togglePlay'); break;
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

    refresh() {
      this.setCurrent({pctPixel: 100 / this.$slider.width()});
    }, // refresh()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss">
@import "../assets/settings.scss";

[data-type="audio"] .below-sheet-music-width .slider {
  margin-bottom: $controls-height;
}
</style>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.audio-player {
  z-index: $layer-the-nav - 1;
  font: $base-size/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  width: 10 * $unit;

  @at-root .below-sheet-music-width & {
    width: 100%;
    border-radius: 0 !important;
  }
}

.btn-play {
  left: 0;
}

.is-loading .btn-play {
  cursor: wait;

  &::before {
    position: absolute;
    content: '';
    left: 50%;
    top: 50%;
    margin: -.5 * $unit;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: $controls-color;
    animation: a-scaleout 1.0s infinite ease-in-out;
  }
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

.bar-progress {
  left: 1.5 * $unit;
  right: .5 * $unit;
  background-color: $disabled-color;
  height: 4px;
  top: 50%;
  transform: translateY(-50%);
  @include short-transition;
}

.bar-seek {
  height: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  box-sizing: content-box;
  cursor: pointer;
  background-color: lighten($controls-color, 75%);
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
  height: $unit / 2;
  @include short-transition;
}

.bar-play {
  height: 100%;
  width: 0;
  box-sizing: content-box;
  border-right: 1px solid $sidebar-bg-color;
  cursor: pointer;
  background-color: $focus-color;
}

.bar-handle {
  right: 0;
  top: 50%;
  height: 0;
  background-color: inherit;
  cursor: ew-resize;

  &::before,
  &::after {
    background-color: inherit;
    border-radius: 50%;
    opacity: 0;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    transform: translate(-50%, -50%);
    @include short-transition;
  }
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
  @include short-transition;

  &::after {
    content: attr(title);
  }
}

.bar-seek.captured .bar-tip,
.bar-handle:hover .bar-tip,
.bar-handle:focus .bar-tip {
  font-size: 11px;
  line-height: 11px;
  padding: .2em;
}
</style>
