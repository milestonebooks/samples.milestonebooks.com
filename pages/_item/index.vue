<template>
  <main>
    <header>
      <h1 class="album-title">Album: {{$store.state.player.title}}</h1>
      <player />
    </header>

    <div class="info">
      <section class="score" v-if="$store.state.player.current.score">
        <a title="Click for printable PDF..." :href="$store.state.player.current.print">
          <img :src="$store.state.player.current.score" />
          <div class="print-note">
            <span class="glue">Click the sheet music to open a printable PDF,</span>
            <span class="glue"> and then press Ctrl+P to print</span>
          </div>
        </a>
      </section>
    </div>
  </main>
</template>

<script>
import Player from '~/components/player.vue';

export default {
  components: {
    Player,
  },

  head () {
    let p = this.$store.state.player;
    return {
      title: (!p.current.track ? this.$store.state.title : `(${p.current.track})${p.current.title ? ' ' + p.current.title : ''} • ${p.title}`),

      link: [
        // audio speaker favicon
        {hid: 'favicon', rel: 'icon', href: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAM5JREFUeNqkkoENgyAQRdWwAB3BFbqCHYGOICPYEewIdgVGqCOUFVjBESjXfBJCDpXU5Es47r/cHbTe++afT9j75ShHBm2lw+7APAZdsxjtpzMAMi9MfIbUHoAzD1g1WppLgJL5jdJd0Cuop1wC+Exc2Ss0YagmgruKGzMwUzUWsb4G4KIpvZEaQDSmb2KrAahkHhFmRfjdmMSRuYUB03fJQ1oFiPnEmwxCsQcAMjkzolCuZiBPrAtaIKATOz3rQtxCP2D7UfLM9F3p8CvAAEfFMGJjRb1WAAAAAElFTkSuQmCC'},
      ],
    }
  },

  methods: {
  }
};
</script>

<style lang="scss">
$backgroundColor: #def;

@mixin drop-shadow() {
  box-shadow: 0 0 1em hsla(210, 100%, 25%, .25);
  box-shadow: 0 0 1em transparentize(darken($backgroundColor, 75%), .75);
}

html {
  font-size: 10px;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  min-height: 100%;
  background: $backgroundColor;
}

main {
  max-width: 650px; // based on sheet music size: 25 + 600 + 25
  margin: auto;
}

header {
  background-color: white;
  border-radius: 0 0 .5em .5em;
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
  color: #c51;
}
.audio-player {
  border-radius: .5em;
}

.info {
  min-width: 600px;
  margin: auto;
  text-align: center;
}

.score {
  margin-top: 1em;
  @include drop-shadow();
}
.score a {
  display:inline-block;
  position:relative;
  background-color:white;
  text-decoration:none;
  /* preserves location of .print-note, even when img is not loaded */
  width: 600px;
  vertical-align:top;
}
.score img {
  position: relative;
  outline: 25px solid white;
  margin-top: 25px;
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
.score a:hover .print-note {
  opacity:0;
  transition: opacity 1s;
}

</style>
