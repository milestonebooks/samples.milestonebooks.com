<template>
  <div>
    <header>
      <h1 class="album-title">Album: {{$store.state.player.title}}</h1>
    </header>
    <player />

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

  </div>
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
      title: (!p.current.track ? this.$store.state.title : `(${p.current.track})${p.current.title ? ' ' + p.current.title : ''} • ${p.title}`)
    }
  },

  methods: {
  }
};
</script>

<style lang="scss">
html {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  min-height: 100%;
  background: #def;
}

.glue {
  white-space: nowrap;
}

.album-title {
  font-size: 1em;
  margin: 0;
  padding: 0.5em;
  text-align: center;
//  background-color: white;
  color: #c51;
}
.audio-player {
  //outline: 50px solid hsla(0,0%,0%,0.05); /* TODO: dev-only */
}

.info {
  min-width: 600px;
  max-width: 650px;
  margin: auto;
  text-align: center;
}

.score {
  margin-top: 1em;
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
