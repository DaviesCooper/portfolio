import type { SlideSource } from '../lib';
import { getSlideLabel } from '../lib';
import title from './1_title';
import housekeeping from './2_housekeeping';
import outline from './3_outline';
import safetyVideo from './4_safety-video';
import safetyFireExtinguishers from './5_safety-fire-extinguishers';
import safetyChlorine from './6_safety-chlorine';
import safetyInterlock from './7_safety-interlock';
import principles from './8_principles';
import principlesControls from './9_principles-controls';
import principlesControlsPositioning from './10_principles-controls-positioning';
import rasterPath from './11_raster-path';
import rasterPathResolution from './12_raster-path-resolution';
import principlesControlsAirAssist from './13_principles-controls-air-assist';
import principlesControlsSigmoid from './14_principles-controls-sigmoid';
import principlesControlsDithering from './15_principles-controls-dithering';
import principlesControlsKerf from './16_principles-controls-kerf';
import protospaceEtiquette from './17_protospace-etiquette';
import protospaceEtiquetteLeftovers from './18_protospace-etiquette-leftovers';
import safetyAgain from './18_safety-again';
import toTheShop from './19_to-the-shop';

/** The slides list is just the list of (slide) components. */
export const slides = [
  title,
  housekeeping,
  outline,
  safetyVideo,
  safetyFireExtinguishers,
  safetyChlorine,
  safetyInterlock,
  principles,
  principlesControls,
  principlesControlsPositioning,
  rasterPath,
  rasterPathResolution,
  principlesControlsAirAssist,
  principlesControlsSigmoid,
  principlesControlsDithering,
  principlesControlsKerf,
  protospaceEtiquette,
  protospaceEtiquetteLeftovers,
  safetyAgain,
  toTheShop,
] as const;

export const defaultSlideSource: SlideSource = {
  slides,
  getSlideLabel(slide, _index) {
    return getSlideLabel(slide);
  },
};
