export const state = () => ({
  init:       false,
  is_playing: true,
  is_loading: false,
}); // state{}

export const getters = {
  ui_class: state => {
    return {
      'is-playing': state.is_playing,
      'is-loading': state.is_loading,
    }
  },
}; // getters{}

export const mutations = {
  init (state) {
    state.init = true;
  },
  play (state) {
    state.is_playing = true;
  },
}; // mutations{}
