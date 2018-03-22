<template>
  <div>
    <h1>Album: {{$store.state.player.title}}</h1>
    <player/>
    <h2>Track: {{$store.state.player.item}}</h2>
  </div>
</template>

<script>
import Player from '~/components/player.vue';

export default {
  components: {
    Player,
  },

  head () {
    return {
      title: this.$store.state.player.title,
    }
  },
};
</script>

<style>
.audio-player {
  outline: 50px solid hsla(0,0%,0%,0.05);
}
</style>
