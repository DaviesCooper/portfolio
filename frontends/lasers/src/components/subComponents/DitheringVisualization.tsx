import { useCallback, useEffect, useRef } from 'react';
import './DitheringVisualization.css';

export type DitherOption = 'none' | 'greyscale' | 'stucki' | 'blue';

export interface DitheringVisualizationProps {
  /** RGBA image data (e.g. 512×512). Origin of the image is irrelevant to the visualizer. */
  imageData: ImageData;
  /** Which dithering to apply; 'none' shows the original image unchanged. */
  ditherOption: DitherOption;
}

/** Stucki error diffusion kernel: (dx, dy, weight); divisor 42. */
const STUCKI_KERNEL: [number, number, number][] = [
  [1, 0, 8], [2, 0, 4],
  [-2, 1, 2], [-1, 1, 4], [0, 1, 8], [1, 1, 4], [2, 1, 2],
  [-2, 2, 1], [-1, 2, 2], [0, 2, 4], [1, 2, 2], [2, 2, 1],
];
const STUCKI_DIV = 42;

function ditherStucki(src: Float32Array, out: Uint8Array, w: number, h: number): void {
  const buf = new Float32Array(src.length);
  buf.set(src);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = buf[i];
      const bit = v < 0.5 ? 1 : 0;  /* 1 = black dot */
      out[i] = bit;
      const err = v - (bit ? 0 : 1);  /* quantized value: 0 for black, 1 for white */
      for (const [dx, dy, weight] of STUCKI_KERNEL) {
        const x2 = x + dx;
        const y2 = y + dy;
        if (x2 >= 0 && x2 < w && y2 >= 0 && y2 < h) {
          buf[y2 * w + x2] += err * (weight / STUCKI_DIV);
        }
      }
    }
  }
}

/** Deterministic [0,1) from pixel coords for blue-noise style threshold. */
function randomThreshold(x: number, y: number): number {
  return Math.random();
}

/** Blue noise: random threshold per pixel. Above threshold -> white, below -> black. */
function ditherBlueNoise(src: Float32Array, out: Uint8Array, w: number, h: number): void {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const thresh = randomThreshold(x, y);
      out[i] = src[i] < thresh ? 1 : 0;  /* below -> black, above -> white */
    }
  }
}

/** Convert ImageData to grayscale Float32Array (0..1). Low alpha treated as white. */
function imageDataToGrayscale(imgData: ImageData): Float32Array {
  const { data, width: w, height: h } = imgData;
  const out = new Float32Array(w * h);
  for (let i = 0; i < out.length; i++) {
    const o = i * 4;
    const r = data[o];
    const g = data[o + 1];
    const b = data[o + 2];
    const a = data[o + 3];
    out[i] = a < 128 ? 1 : (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }
  return out;
}

export function DitheringVisualization(props: DitheringVisualizationProps): JSX.Element {
  const { imageData, ditherOption } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = imageData.width;
    const h = imageData.height;

    if (ditherOption === 'none') {
      ctx.putImageData(imageData, 0, 0);
      return;
    }

    const data = imageDataToGrayscale(imageData);

    if (ditherOption === 'greyscale') {
      /* Show continuous grayscale (no dithering). */
      const imgOut = ctx.createImageData(w, h);
      for (let i = 0; i < data.length; i++) {
        const v = Math.round(data[i] * 255);
        const o = i * 4;
        imgOut.data[o] = v;
        imgOut.data[o + 1] = v;
        imgOut.data[o + 2] = v;
        imgOut.data[o + 3] = 255;
      }
      ctx.putImageData(imgOut, 0, 0);
      return;
    }

    const out = new Uint8Array(data.length);
    if (ditherOption === 'stucki') {
      ditherStucki(data, out, w, h);
    } else {
      ditherBlueNoise(data, out, w, h);
    }

    /* Draw black dots (1) on white (0) for dithered result */
    const imgOut = ctx.createImageData(w, h);
    for (let i = 0; i < out.length; i++) {
      const c = out[i] ? 0 : 255;
      const o = i * 4;
      imgOut.data[o] = c;
      imgOut.data[o + 1] = c;
      imgOut.data[o + 2] = c;
      imgOut.data[o + 3] = 255;
    }
    ctx.putImageData(imgOut, 0, 0);
  }, [imageData, ditherOption]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    draw();
  }, [imageData, draw]);

  return (
    <div className="dithering-visualization-wrap">
      <canvas
        ref={canvasRef}
        className="dithering-visualization-canvas"
        width={imageData.width}
        height={imageData.height}
        aria-label="Dithering preview"
      />
    </div>
  );
}
