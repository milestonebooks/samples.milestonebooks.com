import storage from '../plugins/storage';

//======================================================================================================================

export const state = () => ({
  isInit:     false,
  title:      'Samples',
  gtmID:      'GTM-PHD5MBC', // <https://tagmanager.google.com/?hl=en#/container/accounts/1378342715/containers/6846012>
  psID:       '03yw2k4fbbp6t0zkx602uk0nqu', // <https://admin8.providesupport.com/view/my-account/setup-instructions/monitor-code;wsid=J4SKYwqqHvZIwjTrG3m66KdsVuCskjrm>
  urlBase:    'https://samples.milestonebooks.com/',
  urlBaseImg: 'https://www.milestonebooks.com/img/',

  item:       '',
  type:       'items', // 'items' | 'audio'
  img:        '',
  samples:    [],
  firstId:    '',
  lastId:     '',
  currentIndex:  null,
  currentWScale: 1,

  direction: 'ltr', // 'ltr' | 'rtl'

  isCompactList: true,
  isCompactListTitles: false,

  hasRulers:  false,
  showRulers: false,

  hasPrint:   false,
  isPrinting: false,

  hasTouch:   false,
  hasMouse:   false,

  dpi:        80, // 80 | 120
  hasZoom:    false,
  isZooming:  false,

  scrollbarWidth: 0, // 17px in many/(all?) desktop browsers

  maxHRatio:  null, // tallest (height / width) slide image

  alerts: [],

  persist: [
    {key:'isCompactList',       get: v => v === 'true'},
    {key:'isCompactListTitles', get: v => v === 'true'},
    {key:'showRulers',          get: v => v === 'true'},
    {key:'hasTouch',            get: v => v === 'true'},
    {key:'hasMouse',            get: v => v === 'true'},
    {key:'scrollbarWidth',      get: v => Number(v)},
  ],
});

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  getSample: (state) => (dir = 0, key, currentIndex = null) => {
    const i = (currentIndex === null ? state.currentIndex : currentIndex) + dir;
    const sample = (state.samples[i] ? state.samples[i] : null);
    return sample && key ? sample[key] : sample;
  }, // getSample()

  //------------------------------------------------------------------------------------------------------------------

  imageSrc: (state) => (sample, dpi) => {
    return `${state.urlBase}${state.type === 'audio' ? 'audio' : 'items'}/${state.item}/${state.item}.${sample.id}(${dpi}).${sample.image.ext}`;
  }, // imageSrc()

  //--------------------------------------------------------------------------------------------------------------------

  listItemClass: (state) => (sample) => {
    const i = sample.index;

    return 'item'
      + ` ${i < state.currentIndex ? 'before-' : i > state.currentIndex ? 'after-' : ''}current`
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

      if (state.persist && state.persist.find(p => p.key === key)) storage.setItem(key, o[key]);
    });
  }, // set()

  //--------------------------------------------------------------------------------------------------------------------

  setImageLoaded(state, {i, dpi, loaded = true}) {
    state.samples[i].image.loaded[dpi] = loaded;
  }, //setImageLoaded()

  //--------------------------------------------------------------------------------------------------------------------

  setAlert(state, {msg}) {
    state.alerts.push(msg);
  }, // setAlert()

  //--------------------------------------------------------------------------------------------------------------------

  setSampleImageWScale(state, {i, wScale}) {
    if (state.samples[i].image) state.samples[i].image.wScale = wScale;
  }, // setSampleImageWScale()

  //--------------------------------------------------------------------------------------------------------------------

}; // mutations {}

//======================================================================================================================

export const actions = {

  //--------------------------------------------------------------------------------------------------------------------

  async initSettings({commit, state}) {

    let v;

    for (const p of state.persist) {
      if ((v = storage.getItem(p.key)) !== null) commit('set', {[p.key]: p.get(v)});
    }

  }, // initSettings()

  //--------------------------------------------------------------------------------------------------------------------

  async alert({commit}, {msg}) {
    commit('setAlert', {msg});
  }, // alert()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions {}
