import type { SlideSource } from '../lib';
import { getSlideLabel } from '../lib';
import Slide2 from './Slide2';
import Slide3 from './Slide3';
import Slide4 from './Slide4';
import Slide5 from './Slide5';
import Slide6 from './Slide6';
import Slide7 from './Slide7';
import Slide8 from './Slide8';
import Slide9 from './Slide9';
import Slide10 from './Slide10';
import Slide10_2 from './Slide10d2';
import Slide11 from './Slide11';
import Slide12 from './Slide12';
import Slide13 from './Slide13';
import Slide14 from './Slide14';
import Slide15 from './Slide15';

export { default as Slide2 } from './Slide2';
export { default as Slide3 } from './Slide3';
export { default as Slide4 } from './Slide4';
export { default as Slide5 } from './Slide5';
export { default as Slide6 } from './Slide6';
export { default as Slide7 } from './Slide7';
export { default as Slide8 } from './Slide8';
export { default as Slide9 } from './Slide9';
export { default as Slide10 } from './Slide10';
export { default as Slide10_2 } from './Slide10d2';
export { default as Slide11 } from './Slide11';
export { default as Slide12 } from './Slide12';
export { default as Slide13 } from './Slide13';
export { default as Slide14 } from './Slide14';
export { default as Slide15 } from './Slide15';

/** The slides list is just the list of (slide) components. */
export const slides = [
  Slide2,
  Slide3,
  Slide4,
  Slide5,
  Slide6,
  Slide7,
  Slide8,
  Slide9,
  Slide10,
  Slide10_2,
  Slide11,
  Slide12,
  Slide13,
  Slide14,
  Slide15,
] as const;

export const defaultSlideSource: SlideSource = {
  slides,
  getSlideLabel(slide, _index) {
    return getSlideLabel(slide);
  },
};
