// see <https://gist.github.com/paulirish/5d52fb081b3570c81e3a>
export default function forceRepaint($el = null) {
  ($el || window.$('body')).offset();
}
