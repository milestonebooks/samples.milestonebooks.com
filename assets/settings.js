const DPI_DEFAULT =  80;
const DPI_ZOOM    = 120;

export default {
  DPI_DEFAULT,
  DPI_ZOOM,
  ZOOM_RATIO: DPI_ZOOM / DPI_DEFAULT, // => $zoom-ratio
  TRANSITION_TIME_MS: 250,            // => $transition-time-ms
  TRANSITION_TIME_CONTEXT_MS: 400,    // => $transition-time-context-ms
  FRAME_RULER_WIDTH_NOMINAL: 32,      //TODO => $frame-ruler-width-nominal (action width is 1 pixel less to make a single-pixel center line)
  RULER_WIDTH_NOMINAL: 32,            // => $ruler-width-nominal (action width is 1 pixel less to make a single-pixel center line)
  CONTEXT_MIN_WIDTH: 40,              // ~4em
}
