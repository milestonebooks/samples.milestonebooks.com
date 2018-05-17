import storage from '../plugins/storage';

//======================================================================================================================

export const state = () => ({
  isInit:  false,
  title:   'Samples',
  gtmID:   'GTM-PHD5MBC', // https://tagmanager.google.com/?hl=en#/container/accounts/1378342715/containers/6846012
  urlBase: 'https://samples.milestonebooks.com/',

  item: '',
  type: 'audio',
  samples: [],
  currentIndex: null,
  firstId: '',
  lastId: '',

  alert: '',
});

//======================================================================================================================

export const mutations = {

  //--------------------------------------------------------------------------------------------------------------------

  set(state, o) {
    Object.keys(o).map((key) => {
      state[key] = Array.isArray(o[key]) ? [...state[key], ...o[key]]
        : (typeof o[key] === 'object'    ? {...state[key], ...o[key]} : o[key]);

      if (state.persist && state.persist.includes(key)) storage.setItem(key, o[key]);
    });
  }, // set()

  //--------------------------------------------------------------------------------------------------------------------

};
