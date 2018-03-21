import {Howl} from 'howler';

export const state = () => ({
  init:        false,
  is_playing:  false,
  is_loading:  false,
  is_captured: false,
  interrupted: false,
  interrupt_t: null,

  url_base: 'https://samples.milestonebooks.com/',
  item: '',
  list: {},
  tip: '',
  current: {
    track: null,
    title: null,
    duration: 0,
    pct: 0,
    pctPixel: 0,
    pctHandle: 0,
  },
  min_track: null,
  max_track: null,
}); // state{}

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  ui_class (state) {
    return {
      'is-playing': state.is_playing,
      'is-loading': state.is_loading,
    }
  }, // ui_class()

  //--------------------------------------------------------------------------------------------------------------------

  bar_seek_style (state) {
    return {
      'width': (state.is_loading ? '0%' : '100%'),
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  bar_play_style (state) {
    return {
      'width': `${state.current.pct}%`,
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  bar_handle_style (state) {
    return {
      'left':  (state.is_captured ? (state.current.pctHandle / state.current.pct) * 100 + '%' : 'unset'),
      'right': (state.is_captured ? 'unset' : '0'),
    }
  },

  //--------------------------------------------------------------------------------------------------------------------

  getValidTrack: (state) => (track, inc = 1) => {
    if (track < state.min_track) track = state.min_track;
    if (track > state.max_track) track = state.max_track;
    while (track && !state.list[track]) track += inc;
    return track;
  }, // getValidTrack()

  //--------------------------------------------------------------------------------------------------------------------

  isPctPixelMove: (state) => (pct, pctArg = 'pct') => {
    return Math.abs(pct - state.current[pctArg]) > state.current.pctPixel;
  }, // isPctPixelMove()

  //--------------------------------------------------------------------------------------------------------------------

}; // getters{}

//======================================================================================================================

export const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  init(state) {
    state.init = true;
  },

  //--------------------------------------------------------------------------------------------------------------------

  setItem(state, item) {
    state.item = item;
  },

  //--------------------------------------------------------------------------------------------------------------------

  loadData(state, data) {
    state.list = data.index;

    for (let i of Object.keys(data.index)) {
      if (state.min_track === null) state.min_track = +i;
      if (+i > state.max_track) state.max_track = +i;
    }
    state._data = data;
  },

  //--------------------------------------------------------------------------------------------------------------------

  loadTrack(state, track) {
    console.log('loadTrack',track);

    state.current = {...state.current, ...state.list[track]};
    state.is_loading = true;
  }, // loadTrack()

  //--------------------------------------------------------------------------------------------------------------------

  onLoad(state) {
    state.is_loading = false;
    state.current.duration = window.howls[state.current.track].duration();
    console.log('onLoad()',state.current.duration);
  },

  //--------------------------------------------------------------------------------------------------------------------

  onPlayClick(state) {
    //if (state.is_loading) return false;

    let sound = window.howls[state.current.track];

    if (!state.is_playing) {
      state.current.howlID = sound.play(state.current.howlID);
      state.is_playing = true;
    } else {
      sound.pause(state.current.howlID);
      state.is_playing = false;
    }
  }, // onPlayClick()

  //--------------------------------------------------------------------------------------------------------------------

  onEnd(state) {

    state.is_playing = false;
    console.log('onEnd()'); // TODO

  }, // onEnd()

  //--------------------------------------------------------------------------------------------------------------------

  updateTip(state) {
    let sound = window.howls[state.current.track];
    let sec = Math.floor(sound.seek());
    let min = Math.floor(sec / 60);
    sec -= min * 60;

    state.tip = (min + '').padStart(2, '0') + ':' + (sec + '').padStart(2, '0');
  }, // updateTip()

  //--------------------------------------------------------------------------------------------------------------------

  setCaptured(state, is_captured) {
    state.is_captured = is_captured;
  }, // setCaptured()

  //--------------------------------------------------------------------------------------------------------------------

  setCurrent(state, args) {
    state.current = {...state.current, ...args};
  }, // setCurrent()

  //--------------------------------------------------------------------------------------------------------------------

  interrupt(state, t) {

    if (t) {
      if (!state.interrupted) {
        let sound = window.howls[state.current.track];
        console.log('interrupt() vol:', sound.volume());
        sound.fade(sound.volume(), 0, 400);
      }
      state.interrupt_t = t;
      state.interrupted = true;

    } else {
      clearTimeout(state.interrupt_t);
      state.interrupt_t = undefined;
    }

  }, // interrupt()

  //--------------------------------------------------------------------------------------------------------------------

  sync(state, {from}) {

    if (state.is_playing && !state.interrupted) return;

    let sound = window.howls[state.current.track];

    console.log('sync() from', from,' Interrupted?', state.interrupted, 'vol:', sound.volume(), ...state.current);

    if (from === 'handle') {
      sound.seek(state.current.duration * state.current.pctHandle / 100);
      if (state.is_playing) sound.fade(sound.volume() < 1 ? sound.volume() : 0, 1, 400);
    }

    state.interrupted = false;

  }, // sync()

  //--------------------------------------------------------------------------------------------------------------------

}; // mutations{}

//======================================================================================================================

export const actions = {

  //--------------------------------------------------------------------------------------------------------------------

  loadTrack({dispatch, commit, getters, state}, track) {

    track = getters.getValidTrack(track);

    commit('loadTrack', track);

    window.howls = window.howls || {};

    if (!window.howls[track] && state.list[track].file) {

      window.howls[track] = new Howl({
        src: [state.url_base + state.list[track].file],
        html5: true, // enable playing before loading is complete
        onload: () => { commit('onLoad') },
        onplay: () => { dispatch('setPct') },
        onend:  () => { commit('onEnd') },
      });
    }

  }, // loadTrack()

  //--------------------------------------------------------------------------------------------------------------------

  setPct({dispatch, commit, getters, state}) {

    let pct = (window.howls[state.current.track].seek() / state.current.duration) * 100;

    if (getters.isPctPixelMove(pct)) {
      commit('setCurrent', {pct});
      if (!state.moveCaptured) commit('setCurrent', {pctHandle:pct});
    }

    if (state.is_playing) {
      requestAnimationFrame(() => {
        dispatch('setPct');
      });
    }

  }, // setPct()

  //--------------------------------------------------------------------------------------------------------------------

  setPctHandle({dispatch, commit, getters, state}, pct) {

    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;

    if (!getters.isPctPixelMove(pct, 'pctHandle')) return;

    console.log('onPctHandle()',pct);
    commit('setCurrent', {pctHandle:pct});

    if (state.is_playing && state.interrupted) commit('interrupt', null);

    let t = setTimeout(() => {
      commit('sync', {from:'handle'});
      if (!state.is_playing) dispatch('setPct');
    }, state.is_playing ? 600 : 0);

    if (state.is_playing) commit('interrupt', t);

  }, // setPctHandle()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions{}
