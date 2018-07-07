// adapted from lory.js
export default function supports3d() {
  const el = document.createElement('_');
  const style = el.style;

  let prop;
  let transform;

  if (style[prop = 'webkitTransform'] === '') transform = prop;
  if (style[prop = 'msTransform']     === '') transform = prop;
  if (style[prop = 'transform']       === '') transform = prop;

  document.body.insertBefore(el, null);
  style[transform] = 'translate3d(0, 0, 0)';
  const supports3d = !!global.getComputedStyle(el).getPropertyValue(transform);
  document.body.removeChild(el);
  return supports3d;
}
