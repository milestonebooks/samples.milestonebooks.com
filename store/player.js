export const state = () => ({
  init:       false,
  is_playing: true,
  is_loading: false,

  list: [],
  track: {
    track:    null,
    title:    null,
    filepath: null,
  },
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

  loadData (state, data) {
    state.data = data;
  },

  play (state) {
    state.is_playing = true;
  },
}; // mutations{}
