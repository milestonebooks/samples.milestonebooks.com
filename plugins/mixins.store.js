import storage from '~/plugins/storage.client';

//======================================================================================================================

const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    //console.log('common store set', o);
    Object.keys(o).map(key => {
      state[key] = Array.isArray(o[key]) ? [...(state[key] || []), ...o[key]]
        : (typeof o[key] === 'object'    ? {...(state[key] || {}), ...o[key]} : o[key]);

      if (state.persist && state.persist.find(p => p.key === key)) storage.setItem(key, o[key]);
    });
  }, // set()

  //--------------------------------------------------------------------------------------------------------------------

  setImageWScale(state, {slides, i, wScale}) {
    if (state[slides][i].image) state[slides][i].image.wScale = wScale;
  }, // setImageWScale()

  //--------------------------------------------------------------------------------------------------------------------

  uiStateClass(state, {add = '', remove = '', show = ''}) {
    if (add) {
      for (const v of add.split(' ')) {
        if (!state.uiStateClasses.includes(v)) state.uiStateClasses.push(v);
      }
    }
    if (remove) {
      for (const v of remove.split(' ')) {
        const i = state.uiStateClasses.findIndex(a => a === v);
        if (i !== -1) state.uiStateClasses.splice(i, 1);
      }
    }
    if (show) {
      state.uiStateShow = show;
    }
  }, // uiStateClass()

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

}; // actions {}

//======================================================================================================================

export default {
  mutations,
  actions,
};
