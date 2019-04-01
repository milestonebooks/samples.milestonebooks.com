export default function nextFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(resolve)
  })
}
