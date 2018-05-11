// [2018-03-26] from https://mathiasbynens.be/notes/localstorage-pattern (written 2011-07-29)
const storage = (function() {
  const uid = new Date();
  let storage;
  let result;

  try {
    (storage = window.localStorage).setItem(uid, uid);
    result = storage.getItem(uid) === '' + uid;
    storage.removeItem(uid);
    return result && storage;
  } catch (exception) {}
}()); // storage()

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
