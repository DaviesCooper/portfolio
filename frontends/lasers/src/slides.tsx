import type { LaserTool, SlideData, SlideSource } from './types';
import { getSlideLabel } from './types';
import { AirAssistSimulation } from './components/AirAssistSimulation';
import { BurnSimulation } from './components/BurnSimulation';
import { GCodePathSimulation } from './components/GCodePathSimulation';
import { KerfSimulation } from './components/KerfSimulation';
import { MeasuredBrace } from './components/MeasuredBrace';
import { PrinciplesWithControls } from './components/PrinciplesWithControls';
import { RasterPathSimulation } from './components/RasterPathSimulation';
import { ResolutionLimitSimulation } from './components/ResolutionLimitSimulation';
import { ToolSlider } from './components/ToolSlider';

/**
 * To use Thunder Training (Laser 1) content: paste the PDF text into
 * content/thunder-training-slides.md, then convert each section into a SlideData entry here.
 */
export const slides: ReadonlyArray<SlideData> = [
  {
    id: 'title',
    title: 'Protospace',
    subtitle: 'Lasers',
    content: (
      <>
        <p className="tool-slider-label">Select which laser</p>
        <ToolSlider />
      </>
    ),
  },

  {
    id: 'housekeeping',
    title: 'Housekeeping',
    content: (
      <>
        <ul>
          <li>Vetted vs. Unvetted Members</li>
          <li>Recording During Class</li>
          <li><a href="https://drive.google.com/drive/folders/0By-vvp6fxFekaHBreG1Id2dEb00?resourcekey=0-SUrE5drsOBu9F0jGrk1fZQ&usp=drive_link">Other Slides</a></li>
        </ul>
      </>
    ),
  },
  {
    id: 'outline',
    title: 'Class outline',
    content: (tool: LaserTool) => {
      const toolLabel = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
      return (
        <div className="slide-outline-wrap">
          <MeasuredBrace label="1 hr">
            <ul className="slide-outline">
              <li>Principles of Laser CNC Machines</li>
              <li>Safety</li>
              <li>Protospace Etiquette</li>
              <li>{toolLabel} specifics</li>
              <li>Safety Again</li>
            </ul>
          </MeasuredBrace>
          <hr className="slide-outline-divider" />
          <MeasuredBrace label="1 hr">
            <ul className="slide-outline">
              <li>Live Demo</li>
            </ul>
          </MeasuredBrace>
        </div>
      );
    },
  },
  {
    id: 'principles',
    title: 'Principles of Laser CNC Machines',
    content: (
      <div className="slide-two-col">
        <div className="slide-two-col-left">
          <p>A laser cnc works by using a laser to deposit energy into some material.
            As the laser deposits energy, the material ablates, or burns away.
            Over time the material will burn. This will cause for the material to darken, and with enough exposure, eventually burn through.
          </p>
        </div>
        <div className="slide-two-col-right">
          <BurnSimulation />
        </div>
      </div>
    ),
  },
  {
    id: 'principles-controls',
    title: 'Principles of Laser CNC Machines',
    content: () => <PrinciplesWithControls />,
  },
  {
    id: 'principles-controls-positioning',
    title: 'Principles of Laser CNC Machines',
    content: (
      <div className="slide-two-col">
        <div className="slide-two-col-left">
          <p>We can automate the laser by giving it a series of commands to follow.
            These commands are called G-code.
            The most basic commands are essentially "go to this position", "turn the laser on or off", "move with this speed", and "use this much power".
            Additional commands exist but they are more specialized.
          </p>
          <p>
            This is called a vector path.
          </p>
        </div>
        <div className="slide-two-col-right">
          <GCodePathSimulation />
        </div>
      </div>)
  },
  {
    id: 'principles-controls-raster',
    title: 'Principles of Laser CNC Machines',
    content: (
      <div className="slide-two-col">
        <div className="slide-two-col-left">
          <p>Try to think of a path that can draw a portrait.
            Like modern printers, the best approach is to cover every point of the image on the material.
            These paths are not the most efficient way to draw an image, but they are guaranteed to be as accurate as the machine can make them.
            We create a path that covers every pixel in the image and turn the laser on and off depending on the color of the pixel.
          </p>
          <p>
            This is called a raster path.
          </p>
        </div>
        <div className="slide-two-col-right">
          <RasterPathSimulation />
        </div>
      </div>)
  },
  {
    id: 'principles-controls-resolution',
    title: 'Principles of Laser CNC Machines',
    content: (tool: LaserTool) => {
      const resolutionPpi =
        tool === 'trotec' ? 1000 : tool === 'thunder' ? 500 : 762;
      const toolName = tool === 'trotec' ? 'Trotec' : tool === 'thunder' ? 'Thunder' : 'XTool';
      return (
        <div className="slide-two-col">
          <div className="slide-two-col-left">
            <p>When following a path, the laser will move in small increments.
              The smaller the increments, the more accurate the path will be.
              The more increments, the longer it will take to complete the path.
              The maximum resolution is limited by the machine itself.
              These steps are typically referred to as pixels per inch (PPI), or dots per inch (DPI).
            </p>
            <p>
              The {toolName} has a maximum resolution of {resolutionPpi} ppi.
            </p>
          </div>
          <div className="slide-two-col-right">
            <ResolutionLimitSimulation />
          </div>
        </div>
      );
    },
  },
  {
    id: 'principles-controls-air-assist',
    title: 'Principles of Laser CNC Machines',
    whenTool: 'thunder',
    content: (
      <div className="slide-two-col">
        <div className="slide-two-col-left">
          <p>
            Fire consumes oxygen to burn. The more oxygen we use while the laser is burning, the stringer the burning effect will be.
            When cutting through material, we want to use as much oxygen as possible in order to increase the effectiveness of the laser.
            When engraving, we want to use as little oxygen as possible in order to increase the precision of the engraving.
            If we supply too much oxygen the engraving will "blur" as the burning spreads more than is intended.
          </p>
        </div>
        <div className="slide-two-col-right">
          <AirAssistSimulation />
        </div>
      </div>
    )
  },
  {
    id: 'principles-controls-kerf',
    title: 'Principles of Laser CNC Machines',
    content: (tool: LaserTool) => (
      <div className="slide-two-col">
        <div className="slide-two-col-left">
          <p>
            Kerf is the width of the material that is removed by any process. On a table saw, it is the width of the saw blade. On a laser, it is the width of the laser beam.
            However, the laser beam does not have a fixed size, it depends on the focal length of the lens the laser is pulsed through.
            Depending on how the laser is focused, the kerf will be different.
          </p>
        </div>
        <div className="slide-two-col-right">
          <KerfSimulation
            tool={tool} />
        </div>
      </div>
    )
  },
  {
    id: 'safety',
    title: 'Safety',
    content: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  {
    id: 'protospace-etiquette',
    title: 'Protospace Etiquette',
    content: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
  {
    id: 'machine-specific',
    title: 'Xtool, Trotec, or Thunder',
    content: (
      <div>
        <p>TODO</p>
      </div>
    )
  },
  {
    id: 'safety-again',
    title: 'Safety again',
    content: (
      <div>
        <p>TODO</p>
      </div>
    ),
  },
] as const;

/** Default slide deck. Inject this into Slideshow (D — depend on abstraction). */
export const defaultSlideSource: SlideSource = {
  slides,
  getSlideLabel(slide: SlideData, _index: number): string {
    return getSlideLabel(slide);
  },
};

export type { SlideData };
