export interface BurnVariables {
  power: number;
  radius: number;
  radialFalloff: number;
  /** Animation speed: ms to travel full canvas width (100 units). Duration per segment scales with length so laser moves at constant linear speed. Lower = faster. Optional; default 80. */
  animationSpeedMs?: number;
}