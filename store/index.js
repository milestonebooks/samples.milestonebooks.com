export const state = () => ({
  title: '',
});

export const mutations = {
  setTitle (state, title) {
    state.title = title;
  }
};
