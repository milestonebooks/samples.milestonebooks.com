<template>
  <svg :viewBox="viewBox"><path :d="d"></path></svg>
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
