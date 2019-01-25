<template>
  <div>
    <noscript v-html="gtm"></noscript>
    <nuxt />
  </div>
</template>

<script>
  export default {
    data () {
      return {
        gtm: process.env.tracking ? `<iframe src="https://www.googletagmanager.com/ns.html?id=${this.$store.state.gtmID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>` : '',
      };
    },
  };
</script>
