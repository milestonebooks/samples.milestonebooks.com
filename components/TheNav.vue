<template>
  <aside :class="`the-nav sidebar top h ${isListShown ? 'is-list-shown' : ''}`" @click="onMaskClick">

    <div class="controls">
      <nuxt-link class="btn btn-nav prev ltr" tabindex="1" :title="getSample(-1, 'title')" :disabled="!getSample(-1)" :to="'#' + getSample(-1, 'id')" replace aria-label="previous sample" tag="button">
        <SvgIcon view="28" :d="btnNavPath"></SvgIcon>
      </nuxt-link>
      <button ref="btnList" class="btn btn-nav btn-list" tabindex="1" :title="btnListTitle" @click="toggleList" @keydown="onListKey">
        <span class="id-indicator-frame"><span class="id-indicator-tray" :style="idStyle">
          <span v-for="sample in s.samples" :key="sample.index" class="id-indicator">{{ sample.id }}</span>
        </span></span>
      </button>
      <nuxt-link class="btn btn-nav next ltr" tabindex="1" :title="getSample(+1, 'title')" :disabled="!getSample(+1)" :to="'#' + getSample(+1, 'id')" replace aria-label="next sample" tag="button">
        <SvgIcon view="28" :d="btnNavPath"></SvgIcon>
      </nuxt-link>
    </div>

    <nav ref="list" :class="['list', listClass]" :aria-hidden="!isListShown" @keydown="onListKey">
      <div class="pages">
        <button v-for="sample in s.samples" tabindex="1" :key="sample.index" :class="listItemClass(sample)" :data-id="sample.id" :title="sample.title && s.isCompactListTitles ? sample.title : ''"
            @mouseenter="onListItemMouseEnter" @click="gotoId(sample.id)">
          <span class="item-flex">
            <span class="track"><span class="font-resize">{{ sample.id }}</span></span>
            <span class="title"><span class="font-resize">{{ sample.title }}</span></span>
          </span>
        </button>
      </div>
      <ul class="settings">
        <li><label><input type="checkbox" v-model="compactList" />compact list</label></li>
        <li v-if="s.type === 'audio'"><label><input type="checkbox" v-model="autoPlay" />autoplay</label></li>
        <li v-if="s.type === 'audio'"><label><input type="checkbox" v-model="autoNext" />autonext</label></li>
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

  data () {
    return {
      isListShown: false,
      keyActive: false,
    }
  }, // data()

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    ...mapGetters([
      'getSample',
      'listItemClass',
    ]),
    s() {
      return this.$store.state;
    },
    p() {
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
        'compact': ((this.s.type === 'items' && this.s.isCompactList) || (this.s.type === 'audio' && this.s.isCompactListTitles))
      };
    },
    idStyle() {
      return `transform: translateX(${2.8 * this.s.currentIndex * (this.s.direction === 'rtl' ? 1 : -1)}rem)`;
    },
    autoPlay: {
      get() {
        return this.p.isAutoPlay;
      },
      set(isAutoPlay) {
        this.setPlayer({isAutoPlay});
      },
    },
    autoNext: {
      get() {
        return this.p.isAutoNext;
      },
      set(isAutoNext) {
        this.setPlayer({isAutoNext});
      },
    },
    compactList: {
      get() {
        return (this.s.type === 'audio' ?  this.s.isCompactListTitles : this.s.isCompactList);
      },
      set(isCompactList) {
        this.set({[this.s.type === 'audio' ? 'isCompactListTitles' : 'isCompactList']: isCompactList});
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
  },

  //====================================================================================================================

  methods: {

    ...mapMutations([
      'set',
    ]),
    ...mapMutations('player', {
      'setPlayer': 'set',
    }),

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

    showList() {
      this.$refs.list.style.display = 'block';
      this.isListShown = true;
      this.updateListFocus();
    }, // showList()

    //------------------------------------------------------------------------------------------------------------------

    hideList() {
      if (!this.isListShown) return;

      this.isListShown = false;
      setTimeout(() => {
        this.$refs.list.style.display = 'none';
      }, settings.TRANSITION_TIME_MS);
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
      if (dir && dir.y && !this.isListShown) {
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

      if (!this.isListShown) return this.gotoId(newId);

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
      if (this.isListShown) {
        this.hideList();
        this.$nextTick(() => {
          this.$refs.btnList.focus();
        });
      }
    }, // gotoId()

    //------------------------------------------------------------------------------------------------------------------

    onMaskClick(e) {
      if (e.target === window.$('.is-list-shown')[0]) this.hideList();
    }, // onMaskClick()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-nav {
  z-index: $layer-the-nav;
  width: 3 * $unit;

  &::before {
    content: '';
    @include absolute-center(x);
    width: 100vw;
    height: 100vh;
    background: white;
    opacity: 0;
    pointer-events: none;
    @include short-transition;
  }

  &.is-list-shown::before {
    opacity: .5;
    pointer-events: auto;
  }

  .controls {
    width: 100%;
    height: 100%;
  }
}

.btn:not(:disabled) {
  &:focus,
  &:hover {
    & .id-indicator-frame {
      color: $focus-color;
      border-color: $focus-color;
      @include short-transition;
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

.btn-list {
  z-index: 1; /* raise above .list shadow */
  padding: 1em 1em 0 1em;
  transform: translateY(-50%) translateY(-.5em) translateX(-50%); // sequential because IE11 doesn't support calc() here

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
    //@include short-transition;
  }

  & .id-indicator-tray {
    position: relative;
    display: inline-block;
    height: 100%;
    @include short-transition;
  }

  & .id-indicator {
    position: relative;
    display: inline-block;
    font-size: $list-font-size;
    line-height: 1.2em; // 16 * 1.2 = 19.2 (best compromise between Chrome and Firefox alignment)
    font-weight: bold;
    text-align: center;
    width: 2.8rem;
    height: 1.8rem;
    overflow: hidden;
    //transition: transform $transition-time ease-in-out; // match slide transition time
  }
} // .btn-list

.btn-list::before {
  top: calc(50% + .5em);
  width: $unit;
  height: $unit;

  .is-list-shown & {
    margin: -.5 * $unit;
    border-radius: 0; //$radius $radius 0 0;
    box-shadow: $list-shadow;
    transform: translate(0%, 0%) scale(1); // translate(0%, 0%) ensures expected transition when removing .is-list-shown
  }
}

.list {
  display: none;
  pointer-events: none;
  user-select: none;
  @include absolute-center(x);
  box-sizing: border-box;
  top: 100%;
  width: 100vw;
  max-width: 10 * $unit;
  max-height: calc(100vh - 6em);
  padding: $list-padding;
  background-color: $list-bg-color;
  box-shadow: $list-shadow;
  border-radius: $radius;
  opacity: 0;
  overflow: auto;
  @include short-transition;

  &:not([aria-hidden]) {
    pointer-events: all;
    opacity: 1;
  }

  * {
    position: relative;
  }

  .pages {
    display: flex;
    flex-direction: column;
  }
  &.compact .pages {
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
  &.compact .pages {
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
