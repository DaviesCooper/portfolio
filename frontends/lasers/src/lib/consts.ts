import { Command } from "./command";
import { Gradient } from "./gradient";

// Anodized-metal look: base steel then oxide colors by thickness (straw → purple → blue → cobalt → white)
const metalGradient = new Gradient();
metalGradient.addColorKey(0, { r: 0.75, g: 0.75, b: 0.75 }); /* base steel — shiny/white */
metalGradient.addColorKey(0.15, { r: 0.85, g: 0.72, b: 0.35 });  /* straw yellow */
metalGradient.addColorKey(0.35, { r: 0.58, g: 0.35, b: 0.95 }); /* neon purple / violet */
metalGradient.addColorKey(0.55, { r: 0.25, g: 0.45, b: 0.95 }); /* blue */
metalGradient.addColorKey(0.75, { r: 0.15, g: 0.28, b: 0.65 }); /* cobalt blue */
metalGradient.addColorKey(1, { r: 1, g: 1, b: 1 });             /* white (hot / thick oxide) */

const woodGradient = new Gradient();
woodGradient.addColorKey(0, { r: 0.55, g: 0.35, b: 0.2 }); /* wood brown */
woodGradient.addColorKey(0.1, { r: 0, g: 0, b: 0 }); /* black */
woodGradient.addColorKey(1, { r: 1, g: 1, b: 1 }); /* white */

/** Star vertices from Slide7 (same polygon), in path order. */
const starVertices: [number, number][] = [
    [50, 5], [39, 35], [7, 36], [33, 56], [24, 86], [50, 68], [76, 86], [67, 56], [93, 36], [61, 35],
  ];

/** Star: 10 segments, outer/inner alternating (center 50,50; outer r 45, inner r 18). No overlapping lines. */
const defaultCommands: Command[] = [
    { type: 'goto', x: 50, y: 5 },
    { type: 'on', x: 50, y: 5 },
    { type: 'goto', x: 39, y: 35 },
    { type: 'goto', x: 7, y: 36 },
    { type: 'goto', x: 33, y: 56 },
    { type: 'goto', x: 24, y: 86 },
    { type: 'goto', x: 50, y: 68 },
    { type: 'goto', x: 76, y: 86 },
    { type: 'goto', x: 67, y: 56 },
    { type: 'goto', x: 93, y: 36 },
    { type: 'goto', x: 61, y: 35 },
    { type: 'goto', x: 50, y: 5 },
    { type: 'off', x: 50, y: 5 },
  ];
  
export { metalGradient, woodGradient, defaultCommands, starVertices };