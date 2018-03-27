import {Howl} from 'howler';

// [2018-03-26] from https://mathiasbynens.be/notes/localstorage-pattern (written 2011-07-29)
let storage = (function() {
  let uid = new Date,
    storage,
    result;
  try {
    (storage = window.localStorage).setItem(uid, uid);
    result = storage.getItem(uid) === '' + uid;
    storage.removeItem(uid);
    return result && storage;
  } catch (exception) {}
}());

export const state = () => ({
  is_init:      false,
  is_playing:   false,
  is_loading:   false,
  is_captured:  false,
  interrupted:  false,
  interrupt_t:  null,

//TODO:  is_auto_play: true,
  is_auto_next: true,

  url_base: 'https://samples.milestonebooks.com/',
  item: '',
  list: {},
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

  uiClass (state) {
    return {
      'is-init':    state.is_init,
      'is-playing': state.is_playing,
      'is-loading': state.is_loading,
      'is-multi':   state.min_track !== state.max_track,
    }
  }, // uiClass()

  //--------------------------------------------------------------------------------------------------------------------

  barSeekStyle (state) {
    return {
      'height': (!state.is_init || !state.current.track || state.is_loading ? '0' : '100%'),
    }
  }, // barSeekStyle()

  //--------------------------------------------------------------------------------------------------------------------

  barPlayStyle (state) {
    return {
      'width': `${state.current.pct}%`,
    }
  }, // barPlayStyle

  //--------------------------------------------------------------------------------------------------------------------

  barHandleStyle (state) {
    return {
      'left':  (state.is_captured ? (state.current.pctHandle / state.current.pct) * 100 + '%' : 'unset'),
      'right': (state.is_captured ? 'unset' : '0'),
    }
  }, // barHandleStyle()

  //--------------------------------------------------------------------------------------------------------------------

  getValidTrack: (state) => (track, inc = 1) => {
    if (isNaN(track) || track < state.min_track) track = state.min_track;
    if (track > state.max_track) track = state.max_track;
    while (track && !state.list[track]) track += inc;
    return track;
  }, // getValidTrack()

  //--------------------------------------------------------------------------------------------------------------------

  isPctPixelMove: (state) => (pct, pctArg = 'pct') => {
    return Math.abs(pct - state.current[pctArg]) > state.current.pctPixel;
  }, // isPctPixelMove()

  //--------------------------------------------------------------------------------------------------------------------

  playTitle (state) {
    return (state.is_playing ? 'Pause' : (state.is_init && !state.is_loading ? 'Play' : ''));
  }, // playTitle()

  //--------------------------------------------------------------------------------------------------------------------

  prevTitle (state) {
    let list = Object.keys(state.list).map(i => +i);
    let i = list.indexOf(state.current.track);
    return (i === -1 || i === 0 ? '' : `Prev: ${state.list[list[--i]].title}`);
  }, // prevTitle()

  //--------------------------------------------------------------------------------------------------------------------

  nextTitle (state) {
    let list = Object.keys(state.list).map(i => +i);
    let i = list.indexOf(state.current.track);
    return (i === -1 || i === list.length - 1 ? '' : `Next: ${state.list[list[++i]].title}`);
  }, // nextTitle()

  //--------------------------------------------------------------------------------------------------------------------

  handleTip (state) {
    let sec = Math.floor(state.current.duration * state.current.pctHandle / 100);
    let min = Math.floor(sec / 60);
    sec -= min * 60;

    return `${min > 9 ? '' : '0'}${min}:${sec > 9 ? '' : '0'}${sec}`;
  }, // handleTip()

  //--------------------------------------------------------------------------------------------------------------------

}; // getters{}

//======================================================================================================================

export const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    Object.keys(o).map((key) => {
      state[key] = typeof o[key] === 'object' ? {...state[key], ...o[key]} : o[key];
    });
  }, // set()

  //--------------------------------------------------------------------------------------------------------------------

  setCurrent(state, o) {
    state.current = {...state.current, ...o};
  }, // setCurrent()

  //--------------------------------------------------------------------------------------------------------------------

  loadData(state, data) {
    let min = null;
    let max = null;

    for (let i of Object.keys(data.index)) {
      if (min === null) min = +i;
      if (+i > max) max = +i;
    }

    state.list = data.index;
    state.min_track = min;
    state.max_track = max;
    state._data = data; // for debugging only
  }, // loadData()

  //--------------------------------------------------------------------------------------------------------------------

  setTrack(state, track) {
    console.log('setTrack',track);

    state.current = {...state.current, ...state.list[track]};
    state.is_loading = true;
  }, // setTrack()

  //--------------------------------------------------------------------------------------------------------------------

  setLoaded(state) {
    state.is_loading = false;
    state.current.duration = window.howls[state.current.track].duration();
  }, // setLoaded()

  //--------------------------------------------------------------------------------------------------------------------

  togglePlay(state) {
    if (state.is_loading) return false;

    let sound = window.howls[state.current.track];

    if (!state.is_playing) {
      sound.play();
      state.is_playing = true;
    } else {
      sound.pause();
      state.is_playing = false;
    }
  }, // togglePlay()

  //--------------------------------------------------------------------------------------------------------------------

  interrupt(state, t) {

    if (t) {
      if (!state.interrupted) {
        let sound = window.howls[state.current.track];
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

    if (!state.current.track || (state.is_playing && !state.interrupted)) return;

    let sound = window.howls[state.current.track];

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

  async loadTrack({dispatch, commit, getters, state}, track) {

    track = getters.getValidTrack(+track);

    await dispatch('reset');

    commit('setTrack', track);

    window.howls = window.howls || {};

    if (!window.howls[track] && state.list[track].file) {

      await new Promise((resolve, reject) => {
        window.howls[track] = new Howl({
          src: [state.url_base + state.list[track].file],
          html5: true, // enable playing before loading is complete
          onload: async () => { await dispatch('onLoad'); resolve(); },
          onloaderror: async (id, error) => { await dispatch('onLoadError', {id, error}); reject(new Error({id, error})); },
          onplay: () => { dispatch('setPct') },
          onend:  () => { dispatch('onEnd') },
        });
        window.howls[track].on('loaderror')
      });
    } else {
      dispatch('onLoad');
    }

  }, // loadTrack()

  //--------------------------------------------------------------------------------------------------------------------

  async onLoad({commit, state}) {
    commit('setLoaded');
    if (state.is_auto_play) commit('togglePlay');
  }, // onLoad()

  //--------------------------------------------------------------------------------------------------------------------

  async onLoadError({commit, state}, error) {

    console.log('onLoadError()...', error);

  }, // onLoadError()

  //--------------------------------------------------------------------------------------------------------------------

  async setPct({dispatch, commit, getters, state}, pct) {

    if (pct === undefined) {
      let sec = window.howls[state.current.track].seek();
      pct = (sec / state.current.duration) * 100;
    }

    if (getters.isPctPixelMove(pct)) {
      commit('setCurrent', {pct});
      if (!state.is_captured) commit('setCurrent', {pctHandle:pct});
    }

    if (state.is_playing) {
      requestAnimationFrame(() => {
        dispatch('setPct');
      });
    }

  }, // setPct()

  //--------------------------------------------------------------------------------------------------------------------

  async setPctHandle({dispatch, commit, getters, state}, pct) {

    if (pct < 0) pct = 0;
    if (pct > 100) pct = 100;

    if (!getters.isPctPixelMove(pct, 'pctHandle')) return;

    commit('setCurrent', {pctHandle:pct});

    if (state.is_playing && state.interrupted) commit('interrupt', null);

    let t = setTimeout(() => {
      commit('sync', {from:'handle'});
      if (!state.is_playing) dispatch('setPct');
    }, state.is_playing ? 600 : 0);

    if (state.is_playing) commit('interrupt', t);

  }, // setPctHandle()

  //--------------------------------------------------------------------------------------------------------------------

  async onEnd({dispatch, state}) {

    if (!state.is_auto_next || state.current.track === state.max_track) await dispatch('reset');

  }, // onEnd()

  //--------------------------------------------------------------------------------------------------------------------

  async reset({dispatch, commit, state}) {
    // pause audio to avoid fades
    if (state.is_playing) commit('togglePlay');

    // resets state, then handle, then audio
    await dispatch('setPct',0);
    commit('sync', {from:'handle'});

  }, // reset()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions{}
