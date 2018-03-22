<template>
  <svg :width="width * scale" :viewBox="`0 0 ${width} ${width}`"><path :d="d"></path></svg>
</template>

<script>
  export default {
    props: {
      'width': {type: Number, default: 28},
      'scale': {type: Number, default: 1},
      'd': String,
    },
  };
</script>
