export const state = () => ({
  title: 'Audio Player',
});

export const mutations = {
  setTitle (state, title) {
    state.title = title;
  }
};
