import { useEffect, useState } from 'react';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { SimulationLayout } from '../components/layouts/SimulationLayout';
import { DitheringVisualization } from '../components/subComponents/DitheringVisualization';
import type { DitherOption } from '../components/subComponents/DitheringVisualization';
import { defineSlide } from './defineSlide';

/** Match BurnVisualization / DitheringVisualization canvas size. */
const CANVAS_SIZE = 512;

/** Image in public folder for the dithering demo. */
const DITHER_IMAGE_PATH = '/dither-sample.png';

/** Create 512×512 ImageData: white canvas with RGB gradient (used when no image is loaded). */
function createGradientImageData(): ImageData {
  const data = new Uint8ClampedArray(CANVAS_SIZE * CANVAS_SIZE * 4);
  const s = Math.max(1, CANVAS_SIZE - 1);
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const i = (y * CANVAS_SIZE + x) * 4;
      const r = (x / s) * 255;
      const g = (y / s) * 255;
      const b = Math.max(0, (1 - (x + y) / (2 * s)) * 255);
      data[i] = Math.round((255 + r) / 2);
      data[i + 1] = Math.round((255 + g) / 2);
      data[i + 2] = Math.round((255 + b) / 2);
      data[i + 3] = 255;
    }
  }
  return new ImageData(data, CANVAS_SIZE, CANVAS_SIZE);
}

/** Load image from path, scale to fit inside CANVAS_SIZE×CANVAS_SIZE, return ImageData. Letterbox is white. */
function loadImageAsImageData(path: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const scale = Math.min(CANVAS_SIZE / w, CANVAS_SIZE / h, 1);
      const drawW = Math.round(w * scale);
      const drawH = Math.round(h * scale);
      const x0 = Math.round((CANVAS_SIZE - drawW) / 2);
      const y0 = Math.round((CANVAS_SIZE - drawH) / 2);
      const canvas = document.createElement('canvas');
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.drawImage(img, 0, 0, w, h, x0, y0, drawW, drawH);
      resolve(ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
    img.src = path;
  });
}

const DITHER_OPTIONS: readonly { value: DitherOption; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'greyscale', label: 'Greyscale' },
  { value: 'stucki', label: 'Stucki' },
  { value: 'blue', label: 'Blue noise' },
];

function Slide10_2(): JSX.Element {
  const [ditherOption, setDitherOption] = useState<DitherOption>('none');
  const [imageData, setImageData] = useState<ImageData>(() => createGradientImageData());

  useEffect(() => {
    loadImageAsImageData(DITHER_IMAGE_PATH)
      .then(setImageData)
      .catch(() => setImageData(createGradientImageData()));
  }, []);

  const controls = (
    <div className="tri-select tri-select--square" role="group" aria-label="Dithering type">
      {DITHER_OPTIONS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={ditherOption === value}
          aria-label={label}
          className={`tri-select__option ${ditherOption === value ? 'tri-select__option--selected' : ''}`}
          onClick={() => setDitherOption(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const canvas = (
    <DitheringVisualization imageData={imageData} ditherOption={ditherOption} />
  );

  return (
    <ColumnSlide
      left={
        <p>
          To circumvent the problem of darkness not scaling linearly with the power of the laser, we can use dithering.
          Dithering converts a grayscale image to only use black and white image. This way the laser is always either at max power, or min power.
        </p>
      }
      right={
        <SimulationLayout
          canvas={canvas}
          caption={<p>Compare how different dithering methods convert the image to black and white.</p>}
          controls={controls}
        />
      }
    />
  );
}

export default defineSlide(Slide10_2, {
  id: 'principles-controls-dithering',
  title: 'Principles of Laser CNC Machines',
});
