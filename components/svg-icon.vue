<template>
  <svg :width="width" :viewBox="`0 0 ${width} ${width}`"><path :d="d"></path></svg>
</template>

<script>
  export default {
    props: {
      'width': Number,
      'd': String,
    },
  };
</script>
