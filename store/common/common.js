import storage from '~/plugins/storage';

export default {
  mutations: {

    set(state, o) {
      Object.keys(o).map(key => {
        state[key] = Array.isArray(o[key]) ? [...state[key], ...o[key]]
          : (typeof o[key] === 'object'    ? {...state[key], ...o[key]} : o[key]);

        if (state.persist && state.persist.find(p => p.key === key)) storage.setItem(key, o[key]);
      });
    }, // set()

  }
}
