const TRANSITION_TIME_MS = 250; // => $transition-time-ms
const DPI_DEFAULT = 80;
const DPI_ZOOM    = 120;
const ZOOM_RATIO  = DPI_ZOOM / DPI_DEFAULT; // => $zoom-ratio
const FRAME_RULER_WIDTH_NOMINAL = 32; // => $frame-ruler-width-nominal (action width is 1 pixel less to make a single-pixel center line)

export default {
  TRANSITION_TIME_MS,
  DPI_DEFAULT,
  DPI_ZOOM,
  ZOOM_RATIO,
  FRAME_RULER_WIDTH_NOMINAL,
}
