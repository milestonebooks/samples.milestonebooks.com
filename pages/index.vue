<template>
  <section class="container">
    <div>
      <h1 class="title">
        samples
      </h1>
      <div class="links">
        <a href="/ITEM/">Test Item Page</a>
      </div>
    </div>
  </section>
</template>

<script>

export default {
  components: {
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; /* 1 */
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}
</style>
