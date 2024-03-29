<template>
  <div :class="`the-navbar ${isListShown ? 'is-list-shown' : ''} ${$_i.samples.length === 1 ? 'hide' : ''}`" @click="onMaskClick">
    <aside class="sidebar top h">

      <div class="controls">
        <nuxt-link tag="button" class="btn btn-nav prev ltr" tabindex="0" :disabled="!$store.getters.isShowSamples || !getSlide(-1)" :title="getSlide(-1, 'title')" :to="'#' + getSlide(-1, 'id')" replace aria-label="previous sample">
          <SvgIcon view="28" :d="btnNavPath"></SvgIcon>
        </nuxt-link>
        <button ref="btnList" :class="`btn btn-nav btn-list w${idFrameWidth}`" tabindex="0" :disabled="!$store.getters.isShowSamples" :title="btnListTitle" @click="toggleList" @keydown.stop="onListKey">
          <span class="id-indicator-frame"><span class="id-indicator-tray" :style="idStyle">
            <span v-for="sample in $_i.samples" :key="sample.index" class="id-indicator">{{ sample.id }}</span>
          </span></span>
        </button>
        <nuxt-link tag="button" class="btn btn-nav next ltr" tabindex="0" :disabled="!$store.getters.isShowSamples || !getSlide(+1)" :title="getSlide(+1, 'title')" :to="'#' + getSlide(+1, 'id')" replace aria-label="next sample">
          <SvgIcon view="28" :d="btnNavPath"></SvgIcon>
        </nuxt-link>
      </div>

    </aside>

    <nav ref="navList" :class="['list',listClass]" :disabled="!isListShown" :aria-hidden="!isListShown" @keydown.stop="onListKey">
      <div class="slides" @click="onSlidesClick">
        <button v-for="sample in $_i.samples" tabindex="0" :disabled="!isListShown" :key="sample.index" :class="listItemClass(sample)" :data-id="sample.id" :title="sample.title && $_.isCompactListTitles ? sample.title : ''"
                @mouseenter="onListItemMouseEnter">
            <span class="item-flex">
              <span class="track"><span class="font-resize">{{ sample.id }}</span></span>
              <span class="title"><span class="font-resize">{{ sample.title }}</span></span>
            </span>
        </button>
      </div>
      <ul class="settings">
        <li><label><input type="checkbox" v-model="compactList" tabindex="0" :disabled="!isListShown" />compact list</label></li>
        <li v-if="$_i.type === 'audio'"><label><input type="checkbox" v-model="autoPlay" tabindex="0" :disabled="!isListShown" />autoplay</label></li>
      </ul>
    </nav>
    <div class="list-shadow-mask"></div>

  </div>
</template>

<script>
import SvgIcon from './SvgIcon.vue';

import { mapGetters } from 'vuex';

import settings from '~/assets/settings';
import mixins   from '~/plugins/mixins.vue';

export default {
  components: {
    SvgIcon,
  },

  data () {
    return {
      idFrameWidth: 3, // expand to 4 when needed
      isListShown: false,
      listAcceptPointerEvents: false,
      keyActive: false,
    }
  }, // data()

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters('item', [
      'getSlide',
      'listItemClass',
    ]),

    $_() {
      return this.$store.state;
    },

    $_i() {
      return this.$store.state.item;
    },

    $_p() {
      return this.$store.state.player;
    },

    btnNavPath() {
      return 'M2,2 h4 v24 h-4z M26,2 l -18,12 18,12z'; // right-pointing: 'M2,2 l 18,12 -18,12z M22,2 h4 v24 h-4z'
    },

    btnListTitle() {
      return `${this.isListShown ? 'hide' : 'show'} sample list`;
    },

    listClass() {
      return {
        'compact': ((this.$_i.type === 'items' && this.$_.isCompactList) || (this.$_i.type === 'audio' && this.$_.isCompactListTitles)),
        'accept-events': this.listAcceptPointerEvents,
      };
    },

    idStyle() {
      return `transform: translateX(${this.$_i.currentIndex * (this.$_i.direction === 'rtl' ? 1 : -1) * (this.idFrameWidth - 0.2)}rem)`;
    },

    autoPlay: {
      get() {
        return this.$_p.isAutoPlay;
      },
      set(isAutoPlay) {
        this.set('player', {isAutoPlay});
      },
    },

    compactList: {
      get() {
        return (this.$_i.type === 'audio' ? this.$_.isCompactListTitles : this.$_.isCompactList);
      },
      set(isCompactList) {
        this.set({[this.$_i.type === 'audio' ? 'isCompactListTitles' : 'isCompactList']: isCompactList});
      },
    },

  }, // computed {}

  //====================================================================================================================

  watch: {
    $route() {
      if (this.isListShown) this.hideList();
      // [2018-06-13] Firefox doesn't automatically blur prev/next buttons
      this.$nextTick(() => {
        if (document.activeElement.hasAttribute('disabled')) document.activeElement.blur();
      });
    },

    '$_i.currentIndex'() {
      this.idFrameWidth = (this.$_i.currentIndex !== -1 && this.$_i.samples[this.$_i.currentIndex].id.length > 3 ? 4 : 3);
    },
  },

  //====================================================================================================================

  methods: {

    set: mixins.set,

    throttleKey: mixins.throttleKey,

    //------------------------------------------------------------------------------------------------------------------

    showList() {
      this.isListShown = true;
      this.updateListFocus();

      // pointer events delayed until list is fully expanded (otherwise Firefox fires mouseover events while expanding)
      setTimeout(() => {
        this.listAcceptPointerEvents = true;
      }, settings.TRANSITION_TIME_MS);
    }, // showList()

    //------------------------------------------------------------------------------------------------------------------

    hideList() {
      if (!this.isListShown) return;

      this.isListShown = false;
      this.listAcceptPointerEvents = false;
    }, // hideList()

    //------------------------------------------------------------------------------------------------------------------

    toggleList() {
      this[this.isListShown ? 'hideList' : 'showList']();
    }, // toggleList()

    //------------------------------------------------------------------------------------------------------------------

    onListItemMouseEnter(e) {
      e.target.focus();
    }, // onListItemMouseEnter()

    //------------------------------------------------------------------------------------------------------------------

    getListKeyDir(e, isBtn = false) {
      let dir = {x:0, y:0};

      const id = e.target.getAttribute('data-id');

      switch (e.key) { // <https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key>
      case 'ArrowLeft': case 'Left': case 'PageUp':
        dir.x = -1; break;
      case 'ArrowUp': case 'Up':
        dir.y = -1; break;
      case 'Home':
        dir.x = -1; dir.end = true; break;
      case 'ArrowRight': case 'Right': case 'PageDown':
        dir.x = 1; break;
      case 'ArrowDown': case 'Down':
        dir.y = 1; break;
      case 'End':
        dir.x = 1; dir.end = true; break;
      case ' ':
      case 'Enter':
        if (isBtn) this.toggleList();
        else this.gotoId(id);
        break;
      case 'Escape': case 'Esc':
        if (this.isListShown) {
          this.hideList();
          this.$refs.btnList.focus();
        }
        break;
      default:
        dir = null;
      }

      // don't make any up-down movement unless list is already shown
      if (dir && dir.y && !this.isListShown) {
        this.showList();
        dir.y = 0;
      }

      if (dir && (dir.x || dir.y)) dir.value = dir.x + dir.y;

      return dir;
    }, // getListKeyDir()

    //------------------------------------------------------------------------------------------------------------------

    getIndexById(id) {
      const sample = this.$_i.samples.find((i) => i.id === id);
      return (sample !== undefined ? sample.index : null);
    }, // getIndexById()

    //------------------------------------------------------------------------------------------------------------------

    onListKey(e) {
      const isBtn = (e.target === this.$refs.btnList);

      if (isBtn && this.throttleKey(e)) return;

      const dir = this.getListKeyDir(e, isBtn);

      if (e.target === this.$refs.navList && !this.isListShown) {
        if (e.key !== 'Tab' && e.key !== 'Shift') this.$refs.btnList.focus();
        return;
      }

      if (!dir) return;

      e.preventDefault();

      const id = e.target.getAttribute('data-id');
      let i = this.getIndexById(id);

      if (dir.end === true) {
        i = dir.value < 0 ? 0 : this.$_i.samples.length - 1;
        dir.value = 0;
      }

      const newId = this.getSlide(dir.value, 'id', i);
      if (newId === null) return;

      if (!this.isListShown) return this.gotoId(newId);

      this.updateListFocus(newId);

    }, // onListKey()

    //------------------------------------------------------------------------------------------------------------------

    updateListFocus(id = null) {
      if (!id) id = this.getSlide(0, 'id');
      window.$(this.$el).find(`.list .item[data-id="${id}"]`)[0].focus();
    }, // updateListFocus()

    //------------------------------------------------------------------------------------------------------------------

    onSlidesClick(e) {
      const id = window.$(e.target).closest('[data-id]').attr('data-id');
      if (id) this.gotoId(id);
    }, // onSlidesClick()

    //------------------------------------------------------------------------------------------------------------------

    gotoId(id) {
      this.$router.replace(`#${id}`);
      if (this.isListShown) {
        this.hideList();
        this.$nextTick(() => {
          this.$refs.btnList.focus();
        });
      }
    }, // gotoId()

    //------------------------------------------------------------------------------------------------------------------

    onMaskClick(e) {
      if (e.target === window.$(this.$el).filter('.is-list-shown')[0]) this.hideList();
    }, // onMaskClick()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-navbar {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;

  &.hide {
    display: none;
  }

  > * {
    pointer-events: all;
  }

  // modal mask
  &::before {
    z-index: $layer-the-navbar;
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: white;
    opacity: 0;
    pointer-events: none;
    @include short-transition;
  }

  &.is-list-shown::before {
    opacity: .5;
    pointer-events: auto;
  }

  .sidebar {
    z-index: $layer-the-navbar;
    width: 3 * $unit;
  }

  .controls {
    width: 100%;
    height: 100%;
  }
}

.has-scrollbar-y .the-navbar {
  .sidebar,
  .list,
  .list-shadow-mask {
    // TODO: [2018-11] IE seems to subtract half the width of .sidebar (6em) in calculating left edge
    left: calc(50% - #{round($scrollbar-width / 2)}); // decimal values can produce misalignments in Edge
  }
}

.btn:not(:disabled) {
  &:focus,
  &:hover {
    & .id-indicator-frame,
    & .id-indicator {
      color: $focus-color;
      border-color: $focus-color;
    }
  }
}

.btn svg {
  width: 1.4em;
  height: 1.4em;
}

.btn-nav:not(.btn-list) {
  z-index: 2; // raise above .btn-list shadow

  @at-root
  [data-dir="ltr"] &.prev,
  [data-dir="rtl"] &.next {
    left: 0;
  }
  @at-root
  [data-dir="ltr"] &.next,
  [data-dir="rtl"] &.prev {
    right: 0;
    svg {
      transform: translate(-50%, -50%) rotate(180deg);
    }
  }
}

.btn-list {
  left: 50%;
}

$frame_width:    3rem;
$frame_width_w4: 4rem;

.btn-list {
  z-index: 1; // raise above .list shadow
  padding: 1em 1em 0 1em;
  transform: translateY(-50%) translateY(-.5em) translateX(-50%); // sequential because IE11 doesn't support calc() here

  & .id-indicator-frame {
    width: $frame_width;
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
  &.w4 .id-indicator-frame {
    width: $frame_width_w4;
  }

  & .id-indicator-tray {
    position: relative;
    display: inline-block;
    height: 100%;
    @include short-transition;

    @at-root .no-transition#{&} {
      transition: opacity $transition-time-ms ease-in-out;
    }
  }

  & .id-indicator {
    position: relative;
    display: inline-block;
    font-size: $list-font-size;
    line-height: 1.2em; // 16 * 1.2 = 19.2 (best compromise between Chrome and Firefox alignment)
    font-weight: bold;
    text-align: center;
    width: $frame_width - 0.2rem;
    height: 1.8rem;
    overflow: hidden;
    @include short-transition;
  }
  &.w4 .id-indicator {
    width: $frame_width_w4 - 0.2rem;
  }
} // .btn-list

.btn-list::before {
  top: calc(50% + .5em);
  width: $unit;
  height: $unit;

  .is-list-shown & {
    margin: -.5 * $unit;
    border-radius: 0;
    box-shadow: $list-shadow;
    transform: translate(0%, 0%) scale(1) !important; // translate(0%, 0%) ensures expected transition when removing .is-list-shown
  }
}

// decoration to make list appear seamless with button
.list-shadow-mask {
  pointer-events: none;
  position: absolute;
  z-index: $layer-the-navbar + 1;
  @include absolute-center(x);
  background: $background-color;
  top: 3.25em;
  width: 4em;
  height: .75em;
  @include short-transition;

  opacity: 0;
  transform: translateX(-50%) scale(0);

  @at-root .is-list-shown & {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.list {
  z-index: $layer-the-navbar;
  pointer-events: none;
  user-select: none;
  @include absolute-center(x);
  box-sizing: border-box;
  top: $unit;
  width: 100%;
  max-width: 10 * $unit;
  max-height: calc(100% - 6em);
  padding: $list-padding;
  background-color: $list-bg-color;
  box-shadow: $list-shadow;
  border-radius: $radius;
  overflow: auto;
  @include short-transition;

  opacity: 0;
  transform-origin: center -$unit;
  transform: translateX(-50%) scale(0);

  &:not([aria-hidden]) {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
  &.accept-events {
    pointer-events: all;
  }

  &::before {
    content: '';
    width: 4em;
    height: .75em;
    @include absolute-center(x);
    bottom: 100%;
  }

  * {
    position: relative;
  }

  :focus {
    outline: none;
  }

  .slides {
    display: flex;
    flex-direction: column;
  }
  &.compact .slides {
    flex-direction: row;
    flex-wrap: wrap;
    padding: $list-padding;
  }

  button {
    margin: 0;
    padding: 0;
    border: none;
    text-align: inherit;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .item { // .item is a <button> which cannot be flex (see child .item-flex)
    height: 1 * $unit;
    cursor: pointer;
    background-color: white;
    border: 1px solid $list-bg-color; // $list-item-border-color;
    transition: all .2s ease-in-out, margin 0s ease-in-out; // transitioning margins (row vs column) looks weird

    &.current {
      border-color: $list-item-border-color;
    }
  }

  &.compact .item {
    width: 1 * $unit;
    margin-bottom: ($list-padding * 2);
  }
  &.compact .slides {
    margin-bottom: -($list-padding * 2);
  }

  &:not(.compact) .item:not(:first-child).sequential-before {
    margin-top: -1px;
  }

  @at-root [data-dir="ltr"] &.compact .item:not(:last-child).sequential-after {
    margin-right: -1px;
  }
  @at-root [data-dir="rtl"] &.compact .item:not(:last-child).sequential-after {
    margin-left: -1px;
  }

  .item.non-sequential-after::after {
    content: '';
    pointer-events: none;
    position: absolute;
    width: 3px;
    height: 3px;
    background-color: darken($list-item-border-color, 10%);
    border-radius: 50%;
  }

  &:not(.compact) .item.non-sequential-after {
    margin-bottom: calc(#{$list-padding * 2} - 1px) !important;

    &::after {
      left: 50%;
      transform: translateX(-50%);
      top: calc(100% + #{$list-padding} - 1px);
    }
  }
  &.compact .item.non-sequential-after {
    @at-root [data-dir="ltr"] & {
      margin-right: calc(#{$list-padding * 2} - 1px) !important;
    }
    @at-root [data-dir="rtl"] & {
      margin-left: calc(#{$list-padding * 2} - 1px) !important;
    }

    &::after {
      top: 50%;
      transform: translateY(-50%);
      @at-root [data-dir="ltr"] & {
        left: calc(100% + #{$list-padding} - 1px);
      }
      @at-root [data-dir="rtl"] & {
        right: calc(100% + #{$list-padding} - 1px);
      }
    }
  }

  .item.current,
  .item:focus {
    color: $focus-color;
  }

  .item.current {
    cursor: default;
    font-weight: bold;
    background-color: $list-current-bg-color;
  }

  .item:focus {
    border-color: $list-item-border-focus-color;
  }
  &:not(.compact) .item:focus + .sequential-before {
    border-top-color: $list-item-border-focus-color;
  }
  // looks a little tacky on flex-wrap row break
  @at-root [data-dir="ltr"] &.compact .item:focus + .sequential-before {
    border-left-color: $list-item-border-focus-color;
  }
  @at-root [data-dir="rtl"] &.compact .item:focus + .sequential-before {
    border-right-color: $list-item-border-focus-color;
  }

  .item-flex {
    width: 100%;
    height: 100%;
    display: flex;

    > * {
      display: flex;
      align-items: center;

      > * {
        flex: 1 1 auto;
      }
    }
  } // .item-flex

  .track {
    flex: 0 0 auto; // no resizing
    box-sizing: border-box;
    width: 1 * $unit;
    @at-root [data-dir="ltr"] & {
      text-align: right;
      padding-right: .5em;
    }
    @at-root [data-dir="rtl"] & {
      text-align: left;
      padding-left: .5em;
    }
  }
  &.compact .track {
    width: 100%;
    padding: 0;
    text-align: center;
  }

  .title {
    @at-root [data-dir="ltr"] & {
      margin-left: .5 * $unit;
    }
    @at-root [data-dir="rtl"] & {
      margin-right: .5 * $unit;
    }
    overflow: hidden;
  }
  &.compact .title {
    display: none;
  }

  .font-resize {
    margin-bottom: -1px; // compromise between Chrome and Firefox vertical alignment
  }

  .title .font-resize {
    @include one-line-ellipsis;
  }

  .item .font-resize {
    font-size: $list-font-size;
  }

  .settings {
    padding: .5em 0;

    li {
      display: inline-block;
      margin: 0 1em;
    }

    label {
      display: inline-block;
      font-size: 1.5em;
      padding: .5em 0;
      cursor: pointer;
    }

    input {
      vertical-align: middle;
      margin: 0 .25em;
    }
  } // .settings

} // .list

</style>
