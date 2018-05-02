import {Howl} from 'howler';

import sleep from 'await-sleep';

// TODO: implement storage for isAutoPlay/isAutoNext settings
// [2018-03-26] from https://mathiasbynens.be/notes/localstorage-pattern (written 2011-07-29)
/*
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
//*/

export const state = () => ({
  isInit:      false,
  isPlaying:   false,
  isLoading:   false,
  isCaptured:  false,
  interrupted: false,
  interrupt_t: null,
  isListShown: false,

  isAutoPlay: false, //TODO:true,
  isAutoNext: false, //TODO:true,

  urlBase: 'https://samples.milestonebooks.com/',
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
  minTrack: null,
  maxTrack: null,

  alert: '',
}); // state{}

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  uiClass (state) {
    return {
      'is-init':       state.isInit,
      'is-playing':    state.isPlaying,
      'is-loading':    state.isLoading,
      'is-multi':      state.minTrack !== state.maxTrack,
    }
  }, // uiClass()

  //--------------------------------------------------------------------------------------------------------------------

  barSeekStyle (state) {
    return {
      'height': (!state.isInit || !state.current.track || state.isLoading ? '0' : '100%'),
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
      'left':  (state.isCaptured ? (state.current.pctHandle / state.current.pct) * 100 + '%' : 'unset'),
      'right': (state.isCaptured ? 'unset' : '0'),
    }
  }, // barHandleStyle()

  //--------------------------------------------------------------------------------------------------------------------

  getValidTrack: (state) => (track, inc = 1) => {
    if (isNaN(track) || track < state.minTrack) track = state.minTrack;
    if (track > state.maxTrack) track = state.maxTrack;
    while (track && !state.list[track]) track += inc;
    return track;
  }, // getValidTrack()

  //--------------------------------------------------------------------------------------------------------------------

  isPctPixelMove: (state) => (pct, pctArg = 'pct') => {
    return Math.abs(pct - state.current[pctArg]) > state.current.pctPixel;
  }, // isPctPixelMove()

  //--------------------------------------------------------------------------------------------------------------------

  playTitle (state) {
    return (state.isPlaying ? 'Pause' : (state.isInit && !state.isLoading ? 'Play' : ''));
  }, // playTitle()

  //--------------------------------------------------------------------------------------------------------------------

  prevTitle (state) {
    const list = Object.keys(state.list).map(i => +i);
    let i = list.indexOf(state.current.track);
    return (i === -1 || i === 0 ? '' : `Prev: ${state.list[list[--i]].title}`);
  }, // prevTitle()

  //--------------------------------------------------------------------------------------------------------------------

  nextTitle (state) {
    const list = Object.keys(state.list).map(i => +i);
    let i = list.indexOf(state.current.track);
    return (i === -1 || i === list.length - 1 ? '' : `Next: ${state.list[list[++i]].title}`);
  }, // nextTitle()

  //--------------------------------------------------------------------------------------------------------------------

  handleTip (state) {
    let sec = Math.round(state.current.duration * state.current.pctHandle / 100);
    const min = Math.floor(sec / 60);
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

    for (const i of Object.keys(data.index)) {
      if (min === null) min = +i;
      if (+i > max) max = +i;
    }

    state.list = data.index;
    state.minTrack = min;
    state.maxTrack = max;
    state._data = data; // for debugging only
  }, // loadData()

  //--------------------------------------------------------------------------------------------------------------------

  setTrack(state, track) {
    state.current = {...state.current, ...state.list[track]};
    state.isLoading = true;
  }, // setTrack()

  //--------------------------------------------------------------------------------------------------------------------

  setLoaded(state) {
    state.isLoading = false;
    state.current.duration = window.howls[state.current.track].duration();
  }, // setLoaded()

  //--------------------------------------------------------------------------------------------------------------------

  setAlert(state, msg) {
    state.alert = msg;
  }, // setAlert()

  //--------------------------------------------------------------------------------------------------------------------

  togglePlay(state) {
    if (state.isLoading) return false;

    const sound = window.howls[state.current.track];

    if (!state.isPlaying) {
      sound.play();
      state.isPlaying = true;
    } else {
      sound.pause();
      state.isPlaying = false;
    }
  }, // togglePlay()

  //--------------------------------------------------------------------------------------------------------------------

  interrupt(state, t) {

    if (t) {
      if (!state.interrupted) {
        const sound = window.howls[state.current.track];
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

    if (!state.current.track || (state.isPlaying && !state.interrupted)) return;

    const sound = window.howls[state.current.track];

    if (from === 'handle') {
      sound.seek(state.current.duration * state.current.pctHandle / 100);
      if (state.isPlaying) sound.fade(sound.volume() < 1 ? sound.volume() : 0, 1, 400);
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

    if (state.current.track) {
      const isNext = track > state.current.track;
      commit('setCurrent', {
        scoreLoadingClass: `transition-${isNext ? 'left' : 'right'}`,
        scoreIsLoaded: false,
      });
      await sleep(250);
      commit('setCurrent', {
        scoreLoadingClass: `transition-${isNext ? 'right' : 'left'}`,
      });
      await sleep(250); // allow time for the element to invisibly transition to the opposite side
    }

    commit('setTrack', track);

    window.howls = window.howls || {};

    if (!window.howls[track] && state.list[track].file) {

      await new Promise((resolve, reject) => {
        window.howls[track] = new Howl({
          src: [state.urlBase + state.list[track].file],
          html5: true, // enable playing before loading is complete
          onload: async () => { await dispatch('onLoad'); resolve(); },
          onloaderror: async (id, error) => { await dispatch('onLoadError', error); reject(error); },
          onplay: () => { dispatch('setPct') },
          onend:  () => { dispatch('onEnd') },
        });
      });
    } else {
      dispatch('onLoad');
    }

  }, // loadTrack()

  //--------------------------------------------------------------------------------------------------------------------

  async onLoad({commit, state}) {
    commit('setLoaded');
    if (state.isAutoPlay) commit('togglePlay');
  }, // onLoad()

  //--------------------------------------------------------------------------------------------------------------------

  async onLoadError({commit, state}, error) {
    commit('setAlert', 'Unable to load audio.');
  }, // onLoadError()

  //--------------------------------------------------------------------------------------------------------------------

  async setPct({dispatch, commit, getters, state}, pct) {

    if (pct === undefined) {
      const sec = window.howls[state.current.track].seek();
      pct = (sec / state.current.duration) * 100;
    }

    if (getters.isPctPixelMove(pct)) {
      commit('setCurrent', {pct});
      if (!state.isCaptured) commit('setCurrent', {pctHandle:pct});
    }

    if (state.isPlaying) {
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

    if (state.isPlaying && state.interrupted) commit('interrupt', null);

    const t = setTimeout(() => {
      commit('sync', {from:'handle'});
      if (!state.isPlaying) dispatch('setPct');
    }, state.isPlaying ? 600 : 0);

    if (state.isPlaying) commit('interrupt', t);

  }, // setPctHandle()

  //--------------------------------------------------------------------------------------------------------------------

  async onEnd({dispatch, state}) {

    if (!state.isAutoNext || state.current.track === state.maxTrack) await dispatch('reset');

  }, // onEnd()

  //--------------------------------------------------------------------------------------------------------------------

  async reset({dispatch, commit, state}) {
    // pause audio to avoid fades
    if (state.isPlaying) commit('togglePlay');

    // resets state, then handle, then audio
    await dispatch('setPct',0);
    commit('sync', {from:'handle'});

  }, // reset()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions{}
