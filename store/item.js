import common from '~/assets/store.common';

//======================================================================================================================

export const state = () => ({
  isInit:        false,

  title:         '',
  code:          '',
  type:          'items', // 'items' | 'audio'
  samples:       [],
  firstId:       '',
  lastId:        '',
  currentIndex:  null,
  currentWScale: 1,
  direction:    'ltr', // 'ltr' | 'rtl'

  hasRulers:     false,
  showRulers:    false,

  hasPrint:      false,
  isPrinting:    false,

  dpi:           80, // 80 | 120
  hasZoom:       false,
  isZooming:     false,

  hasScrollbarX: false,
  hasScrollbarY: false,

  maxHRatio:     null, // tallest (height / width) slide image

  persist: [
    {key:'showRulers', get: v => v === 'true'},
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

  imageSrc: (state, getters, rootState) => (sample, dpi) => {
    return `${rootState.urlBase}${state.type === 'audio' ? 'audio' : 'items'}/${state.code}/${state.code}.${sample.id}(${dpi}).${sample.image.ext}`;
  }, // imageSrc()

  //--------------------------------------------------------------------------------------------------------------------

  listItemClass: (state) => (sample) => {
    const i = sample.index;

    return 'item'
      + ` ${i < state.currentIndex ? 'before-' : i > state.currentIndex ? 'after-' : ''}current`
      + (sample.nonsequential ? ' non-' : ' ') + 'sequential-before'
      + (i < state.samples.length - 1 && state.samples[i + 1].nonsequential ? ' non-' : ' ') + 'sequential-after';
  }, // listItemClass()

  //--------------------------------------------------------------------------------------------------------------------

}; // getters {}

//======================================================================================================================

export const mutations = {

  set: common.mutations.set,

  //--------------------------------------------------------------------------------------------------------------------

  setImageLoaded(state, {i, dpi, loaded = true}) {
    state.samples[i].image.loaded[dpi] = loaded;
  }, //setImageLoaded()

  //--------------------------------------------------------------------------------------------------------------------

  setSampleImageWScale(state, {i, wScale}) {
    if (state.samples[i].image) state.samples[i].image.wScale = wScale;
  }, // setSampleImageWScale()

  //--------------------------------------------------------------------------------------------------------------------

}; // mutations {}

//======================================================================================================================

export const actions = {

  initSettings: common.actions.initSettings,

  //--------------------------------------------------------------------------------------------------------------------

}; // actions {}
