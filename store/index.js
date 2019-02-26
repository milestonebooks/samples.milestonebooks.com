import mixins from '~/plugins/mixins.store';

//======================================================================================================================

export const state = () => ({
  _showDebugger: (process.env.NODE_ENV === 'development' || process.env.NUXT_ENV_DEBUG === 'on'),
  _debugText:    null,
  _debugCheck:   null,
  _focusItem:    true, // TODO

  isDev:      false,
  isInit:     false,
  gtmID:      'GTM-PHD5MBC', // <https://tagmanager.google.com/?hl=en#/container/accounts/1378342715/containers/6846012>
  psID:       '03yw2k4fbbp6t0zkx602uk0nqu', // <https://admin8.providesupport.com/view/my-account/setup-instructions/monitor-code;wsid=J4SKYwqqHvZIwjTrG3m66KdsVuCskjrm>
  urlBase:    'https://samples.milestonebooks.com/',
  urlBaseImg: 'https://www.milestonebooks.com/img/',
  isResizing:  false,

  isCompactList:       true,
  isCompactListTitles: false,

  showContext:  false,
  isContexting: false,

  hasTouch:     false,
  hasMouse:     false,

  scrollbarWidth: 0, // 17px in major Windows desktop browsers (2018) <https://codepen.io/sambible/post/browser-scrollbar-widths>
  hasScrollbarX:  false,
  hasScrollbarY:  false,

  alerts: [],

  history: [],

  persist: [
    {key:'isCompactList',       get: v => v === 'true'},
    {key:'isCompactListTitles', get: v => v === 'true'},
    {key:'hasTouch',            get: v => v === 'true'},
    {key:'hasMouse',            get: v => v === 'true'},
    {key:'scrollbarWidth',      get: v => Number(v)},
  ],
});

//======================================================================================================================

export const getters = {

  //------------------------------------------------------------------------------------------------------------------

  //--------------------------------------------------------------------------------------------------------------------

}; // getters {}

//======================================================================================================================

export const mutations = {

  set: mixins.mutations.set,

  //--------------------------------------------------------------------------------------------------------------------

  setAlert(state, {msg}) {
    state.alerts.push(msg);
  }, // setAlert()

  //--------------------------------------------------------------------------------------------------------------------

  addToHistory(state, route) {
    state.history.unshift(route);
  }

  //--------------------------------------------------------------------------------------------------------------------

}; // mutations {}

//======================================================================================================================

export const actions = {

  initSettings: mixins.actions.initSettings,

  //--------------------------------------------------------------------------------------------------------------------

  async alert({commit}, {msg}) {
    commit('setAlert', {msg});
  }, // alert()

  //--------------------------------------------------------------------------------------------------------------------

}; // actions {}
