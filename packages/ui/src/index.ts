// Preact DOM overlay; the only package that imports Preact (AD-1). The play view is
// canvas (render); the DOM draws everything else (AD-13): so far the guide line.
export { GUIDE_LINE_ID } from './guide-line/guide-line';
export { mountGuideLine } from './guide-line/mount-guide-line';
