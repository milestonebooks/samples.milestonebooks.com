import storage from '../plugins/storage';

//======================================================================================================================

export const state = () => ({
  isInit:   false,
  title:    'Samples',
  gtmID:    'GTM-PHD5MBC', // <https://tagmanager.google.com/?hl=en#/container/accounts/1378342715/containers/6846012>
  psID:     '03yw2k4fbbp6t0zkx602uk0nqu', // <https://admin8.providesupport.com/view/my-account/setup-instructions/monitor-code;wsid=J4SKYwqqHvZIwjTrG3m66KdsVuCskjrm>
  urlBase:  'https://samples.milestonebooks.com/',

  item:     '',
  type:     'audio',
  samples:  [],
  currentIndex: null,
  firstId:  '',
  lastId:   '',

  hasTouch: false,
  hasMouse: false,

  dpi:       80, // 80 | 120
  hasZoom:   false,
  isZooming: false,
  hasPrint:  false,

  alert:    '',

  persist: ['hasTouch', 'hasMouse'],
});

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  getSample: (state) => (dir = 0, key, currentIndex = null) => {
    const i = (currentIndex === null ? state.currentIndex : currentIndex) + dir;
    const sample = (state.samples[i] ? state.samples[i] : null);
    return sample && key ? sample[key] : sample;
  }, // getSample()

  //--------------------------------------------------------------------------------------------------------------------

  listItemClass: (state) => (sample) => {
    const i = sample.index;

    return 'item'
      + (i === state.currentIndex ? ' current' : '')
      + (!sample.sequential ? ' non-' : ' ') + 'sequential-before'
      + (i < state.samples.length - 1 && !state.samples[i + 1].sequential ? ' non-' : ' ') + 'sequential-after';
  }, // listItemClass()

  //--------------------------------------------------------------------------------------------------------------------

}; // getters {}

//======================================================================================================================

export const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    Object.keys(o).map(key => {
      state[key] = Array.isArray(o[key]) ? [...state[key], ...o[key]]
        : (typeof o[key] === 'object'    ? {...state[key], ...o[key]} : o[key]);

      if (state.persist && state.persist.includes(key)) storage.setItem(key, o[key]);
    });
  }, // set()

  //--------------------------------------------------------------------------------------------------------------------

}; // mutations {}

//======================================================================================================================

export const actions = {

  //--------------------------------------------------------------------------------------------------------------------
  // currently only handles boolean values

  async initSettings({commit, state}) {

    let v;

    for (const key of state.persist) {
      if ((v = storage.getItem(key)) !== null) commit('set', {[key]: v === 'true'});
    }

  }, // initSettings()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions {}
