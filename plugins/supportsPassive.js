// adapted from lory.js
export default function supportsPassive () {
  let supportsPassive = false;

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get () {
        supportsPassive = true;
      }
    });

    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch (e) {}

  return supportsPassive;
}
