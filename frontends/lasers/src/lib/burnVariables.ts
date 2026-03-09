export interface BurnVariables {
  power: number;
  radius: number;
  radialFalloff: number;
  /** Animation speed: ms per command step and per segment. Lower = faster. Optional; default 80. */
  animationSpeedMs?: number;
}