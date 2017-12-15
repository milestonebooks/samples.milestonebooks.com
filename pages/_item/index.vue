<template>
  <div>
    <h1>Above Player</h1>
    <player/>
    <h2>Below Player</h2>
  </div>
</template>

<script>
import Player from '~/components/player.vue';

export default {
  components: {
    Player,
  },

  asyncData ({store}) {
    return {
      title: store.state.title,
    }
  },

  head () {
    return {
      title: this.title,
    }
  }
};
</script>

<style>
.audio-player {
  outline: 50px solid hsla(0,0%,0%,0.05);
}
</style>
