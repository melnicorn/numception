// Web adapters for the platform ports: IndexedDB, Web Audio, Web Share, visibility, reduced motion (AD-16).
export { databaseName } from './database-name';
export { indexedDbDriver } from './indexed-db-driver';
export { webStorage } from './web-storage';
export { type LifecycleDocument, type LifecycleWindow, webLifecycle } from './web-lifecycle';
export { type FeedbackFlagStorage, webFeedbackFlags } from './web-feedback-flags';
export {
  type AudioSessionLike,
  CUES,
  MASTER_GAIN,
  type NoiseCue,
  SOLVE_SCALE_HZ,
  scaleHz,
  type ToneCue,
  type WebAudioContext,
  type WebAudioOptions,
  webAudio,
} from './web-audio-adapter';
