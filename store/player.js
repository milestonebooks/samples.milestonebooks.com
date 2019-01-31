import storage from '~/plugins/storage';
import common from '~/assets/store.common';

export const state = () => ({
  isInit:      false,
  isPlaying:   false,
  isLoading:   false,
  isCaptured:  false,
  interrupted: false,
  interrupt_t: null,
  isListShown: false,
  isValidInputId: true,

  isAutoPlay: null, // default to true if mouse is detected

  current: {
    index: null, // = rootState.currentIndex
    duration: 0,
    pct: 0,
    pctPixel: 0,
    pctHandle: 0,
  },

  persist: [
    {key:'isAutoPlay', get: v => v === 'true'},
  ],
}); // state{}

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  isPlayable (state, getters, rootState) {
    return rootState.item.currentIndex !== null && !state.isLoading;
  }, // isPlayable()

  //--------------------------------------------------------------------------------------------------------------------

  uiClass (state, getters, rootState) {
    return {
      'is-init':       state.isInit,
      'is-playable':   getters.isPlayable,
      'is-playing':    state.isPlaying,
      'is-loading':    state.isLoading,
      'is-multi':      rootState.item.samples.length > 1,
    }
  }, // uiClass()

  //--------------------------------------------------------------------------------------------------------------------

  barSeekStyle (state, getters) {
    return {
      'height': (!getters.isPlayable ? '0' : '100%'),
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

  isPctPixelMove: (state) => (pct, pctArg = 'pct') => {
    return Math.abs(pct - state.current[pctArg]) > state.current.pctPixel;
  }, // isPctPixelMove()

  //--------------------------------------------------------------------------------------------------------------------

  playTitle (state, getters) {
    return (state.isPlaying ? 'Pause' : (getters.isPlayable ? 'Play' : ''));
  }, // playTitle()

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

  set: common.mutations.set,

  //--------------------------------------------------------------------------------------------------------------------

  setCurrent(state, o) {
    state.current = {...state.current, ...o};
  }, // setCurrent()

  //--------------------------------------------------------------------------------------------------------------------

  setLoaded(state) {
    state.isLoading = false;
    state.current.duration = window.howls[state.current.index].duration();
  }, // setLoaded()

  //--------------------------------------------------------------------------------------------------------------------

  interrupt(state, t) {

    if (t) {
      if (!state.interrupted) {
        const sound = window.howls[state.current.index];
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

    if (state.current.index === null || (state.isPlaying && !state.interrupted)) return;

    const sound = window.howls[state.current.index];

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

  async initSettings({commit, state, rootState}) {

    // isAutoPlay should default to true for devices using a mouse
    if (rootState.hasMouse && storage.getItem('isAutoPlay') === null) commit('set', {isAutoPlay: true});

    common.actions.initSettings({commit, state});

    /*
    let v;

    for (const p of state.persist) {
      if ((v = storage.getItem(p.key)) !== null) commit('set', {[p.key]: p.get(v)});
    }
    //*/

  }, // initSettings()

  //--------------------------------------------------------------------------------------------------------------------

  async loadAudio({dispatch, commit, rootState}, index) {

    await dispatch('reset');

    commit('setCurrent', {index});
    commit('set', {isLoading:true});

    window.howls = window.howls || {};

    if (!window.howls[index] && rootState.item.samples[index].audio) {

      await new Promise((resolve, reject) => {
        window.howls[index] = new window.Howl({
          src: [rootState.urlBase + rootState.item.samples[index].audio],
          html5: true, // enable playing before loading is complete
          onload: async () => { await dispatch('onLoad'); resolve(); },
          onloaderror: async (id, error) => { reject(error); },
          onplay: () => { dispatch('setPct') },
          onend:  () => { dispatch('onEnd') },
        });
      });

    } else {
      dispatch('onLoad');
    }

  }, // loadAudio()

  //--------------------------------------------------------------------------------------------------------------------

  async togglePlay({state, commit, getters}, {play = null} = {}) {
    if (!getters.isPlayable || !(window.howls && window.howls[state.current.index])) return false;

    if (play === null) play = !state.isPlaying;

    commit('set', {isPlaying: play});

    window.howls[state.current.index][play ? 'play' : 'pause']();
  }, // togglePlay()

  //--------------------------------------------------------------------------------------------------------------------

  async onLoad({dispatch, commit, state}) {
    commit('setLoaded');
    if (state.isAutoPlay) dispatch('togglePlay');
  }, // onLoad()

  //--------------------------------------------------------------------------------------------------------------------

  async setPct({dispatch, commit, getters, state}, pct) {

    if (pct === undefined) {
      const sec = window.howls[state.current.index].seek();
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

  async onEnd({dispatch, state, rootState}) {

    if (!state.isAutoPlay || state.current.index === rootState.item.samples.length - 1) await dispatch('reset');

  }, // onEnd()

  //--------------------------------------------------------------------------------------------------------------------

  async reset({dispatch, commit, state}) {
    // pause audio to avoid fades
    if (state.isPlaying) dispatch('togglePlay');

    // resets state, then handle, then audio
    await dispatch('setPct',0);
    commit('sync', {from:'handle'});

  }, // reset()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions{}
