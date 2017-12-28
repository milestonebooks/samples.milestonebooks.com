export const state = () => ({
  init:       false,
  is_playing: true,
  is_loading: false,

  url_base: 'https://samples.milestonebooks.com/',
  item: '',
  list: {},
  current: {
    track:    null,
    title:    null,
  },
  min_track: null,
  max_track: null,
}); // state{}

export const getters = {
  ui_class: state => {
    return {
      'is-playing': state.is_playing,
      'is-loading': state.is_loading,
    }
  }, // ui_class()

  getValidTrack: (state) => (track, inc = 1) => {
    if (track < state.min_track) track = state.min_track;
    if (track > state.max_track) track = state.max_track;
    while (track && !state.list[track]) track += inc;
    return track;
  }, // getValidTrack()
}; // getters{}

export const mutations = {
  init (state) {
    state.init = true;
  },

  setItem (state, item) {
    state.item = item;
  },

  loadData (state, data) {
    state.list = data.index;

    for (let i of Object.keys(data.index)) {
      if (state.min_track === null) state.min_track = +i;
      if (+i > state.max_track) state.max_track = +i;
    }
    state._data = data;
  },

  loadTrack (state, track) {
    console.log('loadTrack',track);

    state.current = state.list[track];

    if (!state.current.howl && state.list[track].file) {
      state.current.howl = new Howl({
        src: [state.url_base + state.list[track].file],
        onload: function(id) {
          console.log('onload');
        },
      });
    }
  }, // loadTrack()

  play (state) {
    state.is_playing = true;
  },
}; // mutations{}

export const actions = {
  loadTrack (store, track) {
    store.commit('loadTrack', store.getters.getValidTrack(track));
  }, // loadTrack()
}; // actions{}
