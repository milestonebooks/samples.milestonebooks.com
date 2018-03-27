<template>
  <div>
    <h1>Album: {{$store.state.player.title}}</h1>
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
.audio-player {
  outline: 50px solid hsla(0,0%,0%,0.05);
}
</style>
