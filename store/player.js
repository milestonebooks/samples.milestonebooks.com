export const state = () => ({
  init:       false,
  is_playing: false,
  is_loading: false,

  url_base: 'https://samples.milestonebooks.com/',
  item: '',
  list: {},
  current: {
    track: null,
    title: null,
    duration: 0,
    pct: 0,
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

  bar_seek_style: state => {
    return {
      'width': (state.is_loading ? '0%' : '100%'),
    }
  },

  bar_play_style: state => {
    return {
      'width': state.current.pct + '%',
    }
  },

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
    state.is_loading = true;

    window.howls = window.howls || {};

    if (!window.howls[track] && state.list[track].file) {

      window.howls[track] = new Howl({
        src: [state.url_base + state.list[track].file],
        onload: () => {
          window.$nuxt.$store.commit('player/onLoad');
        },
        onplay: (id) => {
          window.$nuxt.$store.commit('player/onStep');
        },
      });
    }
  }, // loadTrack()

  onLoad (state) {
    state.is_loading = false;
    state.current.duration = window.howls[state.current.track].duration();
  },

  onPlayClick (state) {
    if (state.is_loading) return false;

    let sound = window.howls[state.current.track];

    if (!state.is_playing) {
      state.current.howlID = sound.play(state.current.howlID);
      state.is_playing = true;
    } else {
      sound.pause(state.current.howlID);
      state.is_playing = false;
    }
  }, // onPlayClick()

  onStep (state) {

    let sound = window.howls[state.current.track];

    state.current = {...state.current,
      pct: (sound.seek() / state.current.duration) * 100
    };

    console.log('onStep()', state.current.pct, sound.seek());

    if (sound.playing()) {
      requestAnimationFrame(() => {
        window.$nuxt.$store.commit('player/onStep');
      });
    }

  }, //
}; // mutations{}

export const actions = {
  loadTrack (store, track) {
    store.commit('loadTrack', store.getters.getValidTrack(track));
  }, // loadTrack()
}; // actions{}
