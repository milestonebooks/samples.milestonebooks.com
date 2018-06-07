import storage from '../plugins/storage';

//======================================================================================================================

export const state = () => ({
  isInit:   false,
  title:    'Samples',
  gtmID:    'GTM-PHD5MBC', // <https://tagmanager.google.com/?hl=en#/container/accounts/1378342715/containers/6846012>
  psID:     '03yw2k4fbbp6t0zkx602uk0nqu', // <https://admin8.providesupport.com/view/my-account/setup-instructions/monitor-code;wsid=J4SKYwqqHvZIwjTrG3m66KdsVuCskjrm>
  urlBase:  'https://samples.milestonebooks.com/',

  item:    '',
  type:    'audio',
  samples: [],
  currentIndex: null,
  firstId: '',
  lastId:  '',

  alert:   '',
});

//======================================================================================================================

export const getters = {

  //--------------------------------------------------------------------------------------------------------------------

  getSample: (state) => (dir = 0, key, currentIndex = null) => {
    const i = (currentIndex === null ? state.currentIndex : currentIndex) + dir;
    const sample = (state.samples[i] ? state.samples[i] : null);
    return sample && key ? sample[key] : sample;
  }, // getSample()

}; // getters {}

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

}; // mutations {}
