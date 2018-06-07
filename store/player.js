import storage from '../plugins/storage';

export const state = () => ({
  isInit:      false,
  isPlaying:   false,
  isLoading:   false,
  isCaptured:  false,
  interrupted: false,
  interrupt_t: null,
  isListShown: false,
  isValidInputId: true,

  isAutoPlay: true,
  isAutoNext: true,
  isCompactList: true, // TODO: may want default `false` for audio where titles are available

  current: {
    index: null, // = rootState.currentIndex
    duration: 0,
    pct: 0,
    pctPixel: 0,
    pctHandle: 0,
  },

  persist: ['isAutoPlay', 'isAutoNext', 'isCompactList'],
}); // state{}

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  isPlayable (state, getters, rootState) {
    return rootState.currentIndex !== null && !state.isLoading;
  }, // isPlayable()

  //--------------------------------------------------------------------------------------------------------------------

  uiClass (state, getters, rootState) {
    return {
      'is-init':       state.isInit,
      'is-playable':   getters.isPlayable,
      'is-playing':    state.isPlaying,
      'is-loading':    state.isLoading,
      'is-multi':      rootState.samples.length > 1,
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

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    Object.keys(o).map((key) => {
      state[key] = typeof o[key] === 'object' ? {...state[key], ...o[key]} : o[key];

      if (state.persist && state.persist.includes(key)) storage.setItem(key, o[key]);
    });
  }, // set()

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

  setAlert(state, msg) {
    state.alert = msg;
  }, // setAlert()

  //--------------------------------------------------------------------------------------------------------------------

  togglePlay(state) {
    if (state.isLoading) return false;

    const sound = window.howls[state.current.index];

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

  async initSettings({commit, state}) {

    let v;

    for (const key of state.persist) {
      if ((v = storage.getItem(key)) !== null) commit('set', {[key]: v === 'true'});
    }

  }, // initSettings()

  //--------------------------------------------------------------------------------------------------------------------

  async loadAudio({dispatch, commit, rootState}, index) {

    await dispatch('reset');

    commit('setCurrent', {index});
    commit('set', {isLoading:true});

    window.howls = window.howls || {};

    if (!window.howls[index] && rootState.samples[index].audio) {

      await new Promise((resolve, reject) => {
        window.howls[index] = new window.Howl({
          src: [rootState.urlBase + rootState.samples[index].audio],
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

  async onLoad({commit, state}) {
    commit('setLoaded');
    if (state.isAutoPlay) commit('togglePlay');
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

    if (!state.isAutoNext || state.current.index === rootState.samples.length - 1) await dispatch('reset');

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
