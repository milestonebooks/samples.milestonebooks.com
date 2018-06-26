<template>
  <aside :class="`the-nav ${isListShown ? 'is-list-shown' : ''}`" @click="onMaskClick">

    <div class="controls">
      <nuxt-link class="btn btn-prev" tabindex="1" :title="getSample(-1, 'title')" :disabled="!getSample(-1)" :to="'#' + getSample(-1, 'id')" replace tag="button">
        <SvgIcon view="28" :d="btnPrevPath"></SvgIcon>
      </nuxt-link>
      <button ref="btnList" class="btn btn-list" tabindex="1" :title="btnListTitle" @click="toggleList" @keydown="onListKey">
        <span class="id-indicator-frame">
          <span v-for="sample in s.samples" :key="sample.index" class="id-indicator" :style="`transform: translateX(-${100 * s.currentIndex}%)`">{{ sample.id }}</span>
        </span>
      </button>
      <span class="btn-list-mask"></span>
      <nuxt-link class="btn btn-next" tabindex="1" :title="getSample(+1, 'title')" :disabled="!getSample(+1)" :to="'#' + getSample(+1, 'id')" replace tag="button">
        <SvgIcon view="28" :d="btnNextPath"></SvgIcon>
      </nuxt-link>
    </div>

    <nav ref="list" :class="['list', listClass]" :aria-hidden="!isListShown" @keydown="onListKey">
      <div class="pages">
        <button v-for="sample in s.samples" tabindex="1" :key="sample.index" :class="listItemClass(sample)" :data-id="sample.id"
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
    btnPrevPath() {
      return 'M2,2 h4 v24 h-4z M26,2 l -18,12 18,12z';
    },
    btnNextPath() {
      return 'M2,2 l 18,12 -18,12z M22,2 h4 v24 h-4z';
    },
    btnListTitle() {
      return `${this.isListShown ? 'hide' : 'show'} sample list`;
    },
    listClass() {
      return {
        'compact': ((this.s.type === 'items' && this.s.isCompactList) || (this.s.type === 'audio' && this.s.isCompactListTitles))
      };
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
        console.log('compactList get()', this.s.type, this.s.isCompactListTitles);
        return (this.s.type === 'audio' ?  this.s.isCompactListTitles : this.s.isCompactList);
      },
      set(isCompactList) {
        this.set({[this.s.type === 'audio' ? 'isCompactListTitles' : 'isCompactList']: isCompactList});
      },
    },
  }, // computed {}

  mounted() {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof $ === 'undefined') return;
    this.init();
  }, // mounted ()

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

    init() {
    }, // init()

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

$nav-top: 0;

.the-nav {
  z-index: $layer-the-nav;
  @include absolute-center(x, fixed); // `align-self: center` doesn't work with IE 11 and early iPhones
  top: $nav-top;
  box-sizing: border-box;
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow;
  height: $unit;
  width: 3 * $unit;

  * {
    position: absolute;
  }
  :focus {
    outline: none;
  }

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
}

.btn:not(:disabled) {
  &:focus,
  &:hover {
    & .id-indicator-frame {
      color: $focus-color;
      border-color: $focus-color;
    }
  }
}

.btn svg {
  width: 1.4em;
  height: 1.4em;
  fill: currentColor;
  @include absolute-center();
}

.btn-prev {
  left: 0;
}

.btn-list {
  left: 1 * $unit;
}

.btn-next {
  left: 2 * $unit;
}

// this element is used to prevent clicking on the .btn-list outside the visible ui
// not necessary as long as btn is at top of page
@if $nav-top != 0 {
  .btn-list-mask {
    display: block;
    left: calc((1 * #{$unit}) - 1em);
    width: 6em;
    height: 1em;
    top: -1em;
    z-index: 2; /* raise above .btn-list shadow */
  }
}

.btn-prev,
.btn-next {
  z-index: 2; /* raise above .btn-list shadow */
}

.btn-list {
  z-index: 1; /* raise above .list shadow */
  padding: 1em 1em 0 1em;
  transform: translateY(calc(-50% - .5em)) translateX(-1em);

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
    height: 100%;
    width: 100%;
    overflow: hidden;
    font-size: $list-font-size;
    line-height: 1.2em; // 16 * 1.2 = 19.2 (best compromise between Chrome and Firefox alignment)
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
  border: 1px solid $list-bg-color; // $list-item-border-color;
  transition: all .2s ease-in-out, margin 0s ease-in-out; // transitioning margins (row vs column) looks weird

  &.current {
    border-color: $list-item-border-color;
  }
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

.list .item.non-sequential-after::after {
  content: '';
  pointer-events: none;
  position: absolute;
  width: 3px;
  height: 3px;
  background-color: darken($list-item-border-color, 10%);
  border-radius: 50%;
}

.list:not(.compact) .item.non-sequential-after {
  margin-bottom: calc(#{$list-padding * 2} - 1px) !important;

  &::after {
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% + #{$list-padding} - 1px);
  }
}
.list.compact .item.non-sequential-after {
  margin-right: calc(#{$list-padding * 2} - 1px) !important;

  &::after {
    top: 50%;
    transform: translateY(-50%);
    left: calc(100% + #{$list-padding} - 1px);
  }
}

/* [2018-05-25] hack to fix Edge rendering bug
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
      border-radius: unset;
    }
  }
}
//*/

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

.list .font-resize {
  margin-bottom: -1px; // compromise between Chrome and Firefox vertical alignment
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
