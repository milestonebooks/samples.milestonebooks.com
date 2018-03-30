<template>
  <main :class="mainClass">
    <header>
      <h1 class="album-title">{{headerTitle}}</h1>
      <Player />
    </header>

    <div class="info">
      <section v-if="p.current.score" :class="['score', scoreClass]" :title="scoreTip" v-images-loaded:on.progress="imageProgress" @click="print">
        <img :src="p.current.score" />
        <div class="print-note">
          <span class="glue">Click the sheet music to open a printable PDF,</span>
          <span class="glue"> and then press Ctrl+P to print</span>
        </div>
      </section>
    </div>
  </main>
</template>

<script>
import Player from '~/components/Player.vue';

const imagesLoaded = !process.browser ? {} : require('vue-images-loaded');

export default {
  components: {
    Player,
  },

  directives: {
    imagesLoaded
  },

  head () {
    return {
      title: (!this.p.current.track ? this.$store.state.title : `(${this.p.current.track})${this.p.current.title ? ' ' + this.p.current.title : ''} • ${this.p.title}`),

      link: [
        // audio speaker favicon
        {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  watch: {
    $route: 'update',
  },

  computed: {
    p() {
      return this.$store.state.player;
    },

    mainClass() {
      return {
        'is-loaded':     this.p.title,
        'is-list-shown': this.p.isListShown,
      }
    },

    headerTitle() {
      return !this.p.current.track ? 'loading album...' : `${this.p.title} (${this.p.current.track})`;
    },

    scoreClass() {
      return {
        'is-loaded': this.p.current.scoreIsLoaded,
        'is-printable': this.isPrintable,
      }
    },

    isPrintable() {
      return !!this.p.current.print;
    },

    scoreTip() {
      return this.isPrintable ? 'Click for printable PDF...' : '';
    },
  }, // computed{}

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    update() {
      console.log('update() route...', this.$route.hash);
    }, // update()

    //------------------------------------------------------------------------------------------------------------------

    imageProgress(instance, image) {
      this.$store.commit('player/setCurrent', {scoreIsLoaded: image.isLoaded});
    }, // imageProgress()

    //------------------------------------------------------------------------------------------------------------------

    print() {
      window.location = this.p.current.print;
    }, // print()

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================
};
</script>

<style lang="scss">
$background-color: #def;
$theme-color: #c51;
$radius: .5em;

@mixin drop-shadow() {
  box-shadow: 0 0 1em transparentize(darken($background-color, 75%), .75);
}

html {
  font-size: 10px;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  min-height: 100%;
  background: $background-color;
  overflow-y: scroll; // always on to avoid possible jank when toggling playlist
}

main {
  max-width: 650px; // based on sheet music size: 25 + 600 + 25
  margin: auto;
}

header {
  background-color: white;
  border-radius: 0 0 $radius $radius;
  @include drop-shadow();
}

.glue {
  white-space: nowrap;
}

.album-title {
  font-size: 1.8em;
  margin: 0;
  padding: 0.5em;
  text-align: center;
  color: $theme-color;
}
.audio-player {
  border-radius: $radius;
}

.info {
  min-width: 600px;
  margin: auto;
  text-align: center;
  transition: all .2s ease;
}

.is-list-shown .info {
  opacity: .5;
}

.score {
  position:relative;
  margin-top: 1.5em; // [2018-03-28] Edge bug: 1em (10px) causes white line above score while playing
  background-color: white;
  opacity: 0;
  transition: all .5s ease;
}
.score.is-loaded {
  opacity: 1;
}
.score.is-printable {
  cursor: pointer;
}

.score:not(.is-loaded) > * {
  display: none;
}

.score img {
  position: relative;
  margin: 25px 0;
}

.print-note {
  position:absolute;
  top:50px;
  padding:5px;
  font-size:16px;
  line-height:1.25em;
  border-radius:10px;
  color:gray;
  border:1px solid gray;
  box-shadow:0 0 5px #ccc;
  max-height:2.5em;
  width: 588px;
  overflow:hidden;
  background-color:white;
  opacity:1;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 1s;
}
.print-note.highlight {
  background-color:white;
  animation: highlight-fade 3s;
}

@keyframes highlight-fade {
  0%, 70% {
    background-color:yellow;
  }
  to {
    background-color:white;
  }
}
.score:hover .print-note {
  opacity:0;
  transition: opacity 1s;
}

</style>
