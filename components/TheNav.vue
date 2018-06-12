<template>
  <aside :class="['the-nav', uiClass]">

    <div class="controls">
      <nuxt-link tabindex="3" class="btn btn-prev opt-multi" :title="getSample(-1, 'title')" :disabled="!getSample(-1)" @click.native.stop :to="'#' + getSample(-1, 'id')" replace tag="button">
        <SvgIcon view="28" :d="btnPrevPath"></SvgIcon>
      </nuxt-link>
      <button tabindex="4" ref="btnList" class="btn btn-list opt-multi" @click.stop="toggleList" @keydown="onListKey">
        <span class="id-indicator-frame">
          <span v-for="sample in s.samples" :key="sample.index" class="id-indicator" :style="`transform: translateX(-${100 * s.currentIndex}%)`">{{ sample.id }}</span>
        </span>
      </button>
      <span class="btn-list-mask"></span>
      <nuxt-link tabindex="5" class="btn btn-next opt-multi" :title="getSample(+1, 'title')" :disabled="!getSample(+1)" @click.native.stop :to="'#' + getSample(+1, 'id')" replace tag="button">
        <SvgIcon view="28" :d="btnNextPath"></SvgIcon>
      </nuxt-link>
    </div>

    <nav ref="list" :class="'list' + (p.isCompactList ? ' compact' : '')" :aria-hidden="!p.isListShown" @keydown="onListKey">
      <div class="pages">
        <button v-for="sample in s.samples" :key="sample.index" :class="listItemClass(sample)" :data-id="sample.id"
            @mouseenter="onListItemMouseEnter" @click="gotoId(sample.id)">
          <span class="item-flex">
            <span class="track"><span class="font-resize">{{ sample.id }}</span></span>
            <span class="title"><span class="font-resize">{{ sample.title }}</span></span>
          </span>
        </button>
      </div>
      <ul class="settings">
        <li v-if="s.type === 'audio'"><label><input type="checkbox" v-model="autoPlay" />autoplay</label></li>
        <li v-if="s.type === 'audio'"><label><input type="checkbox" v-model="autoNext" />autonext</label></li>
        <li><label><input type="checkbox" v-model="compactList" />compact list</label></li>
      </ul>
    </nav>

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
    s() {
      return this.$store.state;
    },
    p() {
      return this.$store.state.player;
    },
    btnPlayPath() {
      return (this.p.isPlaying ? 'M4,2 h7 v24 h-7 v-24 z M17,2 h7 v24 h-7 v-24z' : (this.isPlayable ? 'M6,2 l 21,12 -21,12z' : ''));
    },
    btnPrevPath() {
      return 'M2,2 h4 v24 h-4z M26,2 l -18,12 18,12z';
    },
    btnNextPath() {
      return 'M2,2 l 18,12 -18,12z M22,2 h4 v24 h-4z';
    },
    autoPlay: {
      get() {
        return this.p.isAutoPlay;
      },
      set(isAutoPlay) {
        this.set({isAutoPlay});
      },
    },
    autoNext: {
      get() {
        return this.p.isAutoNext;
      },
      set(isAutoNext) {
        this.set({isAutoNext});
      },
    },
    compactList: {
      get() {
        return this.p.isCompactList;
      },
      set(isCompactList) {
        this.set({isCompactList});
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
      console.timeEnd('Player');
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
      this.load(this.currentIndex);
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    async load(index) {
      if (this.s.type === 'audio') {
        await this.$store.dispatch('player/loadAudio', index).catch((err_code) => {
          this.$store.commit('set', {alert: `Error loading audio [${err_code}]`});
          //TODO: this.$root.error({statusCode:500, message:`Error loading audio [${err_code}]`});
        });
        this.refresh();
      }
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

    showList() {
      this.$refs.list.style.display = 'block';
      this.set({isListShown: true});
      this.updateListFocus();
    }, // showList()

    //------------------------------------------------------------------------------------------------------------------

    hideList() {
      if (!this.p.isListShown) return;

      this.set({isListShown: false});
      setTimeout(() => {
        this.$refs.list.style.display = 'none';
      }, settings.TRANSITION_TIME_MS);
    }, // hideList()

    //------------------------------------------------------------------------------------------------------------------

    toggleList() {
      this[this.p.isListShown ? 'hideList' : 'showList']();
    }, // toggleList()
    //------------------------------------------------------------------------------------------------------------------

    onListItemMouseEnter(e) {
      e.target.focus();
    }, // onListItemMouseEnter()

    //------------------------------------------------------------------------------------------------------------------

    getListKeyDir(e, isBtn = false) {
      let dir = {x:0, y:0};

      const id = e.target.getAttribute('data-id');

      switch (e.key) {
      case 'ArrowLeft': case 'Left':
        dir.x = -1; break;
      case 'ArrowUp': case 'Up':
        dir.y = -1;
        break;
      case 'ArrowRight': case 'Right':
        dir.x = 1; break;
      case 'ArrowDown': case 'Down':
        dir.y = 1; break;
      case ' ':
      case 'Enter':
        if (isBtn) this.toggleList();
        else this.gotoId(id);
        break;
      default:
        dir = null;
      }

      // don't make any up-down movement unless list is already shown
      if (dir && dir.y && !this.p.isListShown) {
        this.showList();
        dir.y = 0;
      }

      if (dir && (dir.x || dir.y)) dir.value = dir.x + dir.y;

      return dir;
    }, // getListKeyDir()

    //------------------------------------------------------------------------------------------------------------------

    getIndexById(id) {
      const sample = this.s.samples.find((i) => i.id === id);
      return (sample !== undefined ? sample.index : null);
    }, // getIndexById()

    //------------------------------------------------------------------------------------------------------------------

    onListKey(e) {
      const isBtn = (e.target === this.$refs.btnList);

      if (isBtn && this.throttleKey(e)) return;

      const dir = this.getListKeyDir(e, isBtn);

      if (!dir) return;

      e.preventDefault();

      const id = e.target.getAttribute('data-id');
      const i  = this.getIndexById(id);

      const newId = this.getSample(dir.value, 'id', i);
      if (newId === null) return;

      if (!this.p.isListShown) return this.gotoId(newId);

      this.updateListFocus(newId);

    }, // onListKey()

    //------------------------------------------------------------------------------------------------------------------

    updateListFocus(id = null) {
      if (!id) id = this.getSample(0, 'id');
      window.$(`.list .item[data-id="${id}"]`)[0].focus();
    }, // updateListFocus()

    //------------------------------------------------------------------------------------------------------------------

    gotoId(id) {
      this.$router.replace(`#${id}`);
      if (this.p.isListShown) {
        this.hideList();
        this.$nextTick(() => {
          this.$refs.btnList.focus();
        });
      }
    }, // gotoId()

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
@import "../assets/settings.scss";

.the-nav {
  z-index: $layer-controls;
  box-sizing: border-box;
  position: absolute;
  align-self: center;
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow;
  height: $unit;
  width: 3 * $unit;

  /*
  position: relative;
  font: $base-size/1 Calibri,Arial,Helvetica,Verdana,sans-serif;
  background-color: $player-bg-color;
  box-sizing: border-box;
  font-size: $base-size;
  border-radius: $radius;
  //*/

  * {
    position: absolute;
  }
  :focus {
    outline: none;
  }

  &:not(.is-multi) .opt-multi {
    pointer-events: none;
    opacity: 0;
    @include short-transition;
  }
}

.controls {
  width: 100%;
  height: 100%;
}

.btn {
  width: $unit;
  height: $unit;
  overflow: hidden;
  @include absolute-center(y);
  @include short-transition;
  color: $disabled-color;

  &::before {
    content: '';
    position: absolute;
    background-color: $focus-bg-color;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    @include short-transition;

    @at-root .btn:focus::before {
      transform: translate(-50%, -50%) scale(1);
    }
  }

  &:not(:disabled) {
    cursor: pointer;
    color: $player-color;

    &:focus,
    &:hover {
      color: $focus-color;

      & .id-indicator-frame {
        color: $focus-color;
        border-color: $focus-color; // $list-item-border-focus-color;
      }
    }
  }
}

.btn svg {
  width: 2.8em;
  height: 2.8em;
  fill: currentColor;
  @include absolute-center();

  @at-root .opt-multi#{&} {
    width: 1.4em;
    height: 1.4em;
  }
}

.opt-multi {
  opacity: 0;
  right: 0;
  @include short-transition;

  .is-multi & {
    opacity: 1;
  }
}

.is-multi {
  .btn-prev {
    right: 2 * $unit;
  }

  .btn-list {
    right: 1 * $unit;
  }

  .btn-next {
    right: 0;
  }
}

// this element is used to prevent clicking on the .btn-list outside the visible ui
.is-multi .btn-list-mask {
  display: block;
  right: calc((1 * #{$unit}) - 1em);
  width: 6em;
  height: 1em;
  top: -1em;
  z-index: 2; /* raise above .btn-list shadow */
}

.btn-prev,
.btn-next {
  z-index: 2; /* raise above .btn-list shadow */
}

.btn-list {
  z-index: 1; /* raise above .list shadow */
  padding: 1em 1em 0 1em;
  transform: translateY(calc(-50% - .5em)) translateX(1em);

  & .id-indicator-frame {
    width: 3em;
    height: 2em;
    @include absolute-center();
    text-align: left;
    top: calc(50% + .5em);
    box-sizing: border-box;
    border: 1px solid $list-item-border-focus-color; //darken($list-bg-color, 20%);
    background-color: white;
    white-space: nowrap;
    overflow: hidden;
    @include short-transition;
  }

  & .id-indicator {
    position: relative;
    display: inline-block;
    width: 100%;
    height: 100%;
    font-size: $list-font-size;
    line-height: 1em;
    font-weight: bold;
    text-align: center;
    transition: transform $transition-time ease-in-out; // match slide transition time
  }
} // .btn-list

.btn-list::before {
  top: calc(50% + .5em);
  width: $unit;
  height: $unit;

  .is-list-shown & {
    margin: -.5 * $unit;
    border-radius: $radius $radius 0 0;
    box-shadow: $list-shadow;
    transform: scale(1);
  }
}

.list {
  display: none;
  pointer-events: none;
  user-select: none;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 0em);
  padding: $list-padding;
  background-color: $list-bg-color;
  box-shadow: $list-shadow;
  border-radius: $radius;
  opacity: 0;
  overflow: hidden;
  @include short-transition;
}

.list:not([aria-hidden]) {
  pointer-events: all;
  opacity: 1;
}

.list * {
  position: relative;
}

.list .pages {
  display: flex;
  flex-direction: column;
}
.list.compact .pages {
  flex-direction: row;
  flex-wrap: wrap;
  padding: $list-padding;
}

.list button {
  margin: 0;
  padding: 0;
  border: none;
  text-align: inherit;
}

.list ul, .list ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.list .item { // .item is a <button> which cannot be flex (see child .item-flex)
  height: 1 * $unit;
  cursor: pointer;
  background-color: white;
  border: 1px solid $list-item-border-color;
  transition: all .2s ease-in-out, margin 0s ease-in-out; // transitioning margins looks weird
}

.list.compact .item {
  width: 1 * $unit;
  margin-bottom: ($list-padding * 2);
}
.list.compact .pages {
  margin-bottom: -($list-padding * 2);
}

.list:not(.compact) .item:not(:first-child).sequential-before {
  margin-top: -1px;
}
// adjusting right margin avoids flex-wrap alignment issues
.list.compact .item:not(:last-child).sequential-after {
  margin-right: -1px;
}

//* [2018-05-25] hack to fix Edge rendering bug
html[data-browser*="Trident"],
html[data-browser*="Edge"] {
  .list:not(.compact) .item {
    border-bottom-width: 2px;
    margin-bottom: -1px;

    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 1px;
      top: calc(100% + 1px);
      background-color: $list-bg-color;
    }
  }
}

.list:not(.compact) .item.non-sequential-after {
  margin-bottom: calc(#{$list-padding * 2} - 1px) !important;

  &::after {
    content: '•';
    font-weight: normal;
    color: darken($list-item-border-color, 10%);
    position: absolute;
    top: 100%;
    transform: translateX(-50%);
    left: 50%;
    height: 1em;
  }
}
.list.compact .item.non-sequential-after {
  margin-right: calc(#{$list-padding * 2} - 1px) !important;

  &::after {
    content: '•';
    font-weight: normal;
    color: darken($list-item-border-color, 10%);
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: calc(100% + 0.5px);
    width: calc(1em - 1px);
    text-align: center;
  }
}

.list .item.current,
.list .item:focus {
  color: $focus-color;
}

.list .item.current {
  cursor: default;
  font-weight: bold;
  background-color: $list-current-bg-color;
}

.list .item:focus {
  border-color: $list-item-border-focus-color;
}
.list:not(.compact) .item:focus + .sequential-before {
  border-top-color: $list-item-border-focus-color;
}
.list.compact .item:focus + .sequential-before { // looks a little tacky on flex-wrap row break
  border-left-color: $list-item-border-focus-color;
}

.list .item-flex {
  width: 100%;
  height: 100%;
  display: flex;
}

.list .item-flex > * {
  display: flex;
  align-items: center;
}

.list .item-flex > * > * {
  flex: 1 1 auto;
}

.list .track {
  flex: 0 0 auto; // no resizing
  box-sizing: border-box;
  width: 1 * $unit;
  text-align: right;
  padding-right: .5em;
}
.list.compact .track {
  width: 100%;
  padding-right: 0;
  text-align: center;
}

.list .title {
  margin-left: .5 * $unit;
  overflow: hidden;
}
.list.compact .title {
  display: none;
}

.list .title .font-resize {
  @include one-line-ellipsis;
}

.list .item .font-resize {
  font-size: $list-font-size;
}

.list .settings {
  padding: .5em 0;
}

.list .settings li {
  display: inline-block;
  margin-left: 2em;
}

.list .settings label {
  display: inline-block;
  font-size: 1.5em;
  padding: .5em 0;
  cursor: pointer;
}

.list .settings input {
  vertical-align: middle;
  margin-right: .25em;
}

</style>
