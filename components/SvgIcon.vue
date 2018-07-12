<template>
  <svg :viewBox="viewBox"><path v-if="d" :d="d"></path><slot /></svg>
</template>

<script>
  export default {
    props: {
      view: String,
      d: String,
    },

    computed: {
      viewBox() {
        return this.WxH ? `0 0 ${this.WxH}` : false;
      },
      WxH() {
        return this.view && !this.view.match(' ') ? `${this.view} ${this.view}` : this.view;
      }
    },
  };
</script>
