export const state = () => ({
  init:       false,
  is_playing: true,
  is_loading: false,

  list: {},
  current: {
    track:    null,
    title:    null,
    filepath: null,
  },
  min_track: 0,
  max_track: 99,
}); // state{}

export const getters = {
  ui_class: state => {
    return {
      'is-playing': state.is_playing,
      'is-loading': state.is_loading,
    }
  }, // ui_class()

  validateTrack: (state) => (track, inc = 1) => {
    console.log('validate', track);
    if (track < state.min_track) track = null;
    if (track > state.max_track) track = null;
    while (track && !state.list[track]) track += inc;
    console.log('...',track);
    return track;
  }, // validateTrack()
}; // getters{}

export const mutations = {
  init (state) {
    state.init = true;
  },

  loadData (state, data) {
    state.list = data.index;
    state.data = data;
  },

  loadTrack (state, track) {
    console.log('loadTrack',track);
    //state.current.track = state.getters.validateTrack(track);
  }, // loadTrack()

  play (state) {
    state.is_playing = true;
  },
}; // mutations{}
