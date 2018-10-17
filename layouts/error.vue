<template>
  <main class="error">
    <h1 v-if="error.statusCode === 404">Page not found</h1>
    <h1 v-else>{{ error.message }}</h1>
    <p>Please <a :href="emailLink(error)">send us an email</a> to let us know.</p>
    <p>Return to <a href="https://www.milestonebooks.com">home page</a>.</p>
  </main>
</template>

<script>
export default {
  layout: 'default',
  props: ['error'],

  methods: {
    emailLink(error) {
      return `mailto:office@milestonebooks.com?subject=${encodeURIComponent('site error')}&body=${encodeURIComponent('The following page has an error:')}%0A`
           + (window && window.location ? encodeURIComponent(window.location) : '')
           + (error.message ? `%0A>> ${encodeURIComponent(error.message)}` : '')
           + '%0A%0A';
    }
  }
}
</script>

<style lang="scss">
@import "../assets/settings.scss";

@include base_styling;

.error {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  font-size: 1.5em;
}

.error h1 {
  font-size: 1.5em;
  color: $alert-color;
}
</style>
