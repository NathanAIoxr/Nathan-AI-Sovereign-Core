import catalog from './worker.mjs';
import musicLab from './music-lab-original.mjs';
import { mountSongIndex } from './music-lab-adapter.mjs';

export default mountSongIndex(catalog, musicLab);
