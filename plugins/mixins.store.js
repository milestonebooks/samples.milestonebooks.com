import storage from '~/plugins/storage.client';

//======================================================================================================================

const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    //console.log('common store set', o, 'isCompactList:', state.isCompactList);
    Object.keys(o).map(key => {
      state[key] = Array.isArray(o[key]) ? [...state[key], ...o[key]]
        : (typeof o[key] === 'object'    ? {...state[key], ...o[key]} : o[key]);

      if (state.persist && state.persist.find(p => p.key === key)) storage.setItem(key, o[key]);
    });
  }, // set()

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
