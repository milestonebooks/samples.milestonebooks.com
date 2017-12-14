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
};
</script>
