// jQuery-style custom function
window.$.fn.offsetRect = function() {
  return this[0].getBoundingClientRect();
};
