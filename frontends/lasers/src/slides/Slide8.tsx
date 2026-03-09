import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide8(_props: SlideComponentProps): JSX.Element {
  return (
    <ColumnSlide
      left={
        <>
          <p>
            Try to think of a path that can draw a portrait. Like modern printers, the best
            approach is to cover every point of the image on the material. These paths are not the
            most efficient way to draw an image, but they are guaranteed to be as accurate as the
            machine can make them. We create a path that covers every pixel in the image and turn
            the laser on and off depending on the color of the pixel.
          </p>
          <p>This is called a raster path.</p>
        </>
      }
      right={
        <p>(Raster path simulation placeholder)</p>
      }
    />
  );
}

export default defineSlide(Slide8, {
  id: 'principles-controls-raster',
  title: 'Principles of Laser CNC Machines',
});
