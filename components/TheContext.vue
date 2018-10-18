<template>
  <aside class="the-context">
    The Context
    <div class="slides">
      <section class="slide">
        <div class="slide-liner">
          <img :src="imgSrc" @load="onLoad($event)" @error="onError" />
        </div>
      </section>
    </div>
  </aside>
</template>

<script>

export default {
  components: {
  },

  //--------------------------------------------------------------------------------------------------------------------

  computed: {
    s() {
      return this.$store.state;
    },

    imgSrc() {
      return this.s && this.s.img ? `${this.s.urlBaseImg}${this.s.img}` : '';
    }
  }, // computed {}

  //====================================================================================================================

  methods: {

    //------------------------------------------------------------------------------------------------------------------

    //------------------------------------------------------------------------------------------------------------------

  }, // methods{}

  //====================================================================================================================

};
</script>

<style lang="scss" scoped>
@import "../assets/settings.scss";

.the-context {
  z-index: $layer-the-context;
  position: fixed;
  top: 1em !important;
  left: 1em !important;
  width: $unit;
  @include drop-shadow;

  background-color: red;
}

// copied from TheSlider.vue

.slides {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;

  #{$isIE} & {
    display: inline-block;
  }
  @include short-transition;

  @at-root .no-transition#{&} {
    transition: none;
  }
}

</style>
