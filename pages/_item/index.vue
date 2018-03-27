<template>
  <div>
    <header>
      <h1 class="album-title">Album: {{$store.state.player.title}}</h1>
    </header>
    <player />
    <h2>Track: {{$store.state.player.current.title}}</h2>
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

<style>
html {
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
}
.album-title {
  font-size: 1em;
  margin: 0;
  padding: 0.5em;
  background: #9cf;
  color: #c51;
  text-shadow: 0 0 .25em white;
}
.audio-player {
  outline: 50px solid hsla(0,0%,0%,0.05);
}
</style>
