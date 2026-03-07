import type { LaserTool, SlideData, SlideSource } from './types';
import { getSlideLabel } from './types';
import { BurnSimulation } from './components/BurnSimulation';
import { GCodePathSimulation } from './components/GCodePathSimulation';
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
    id: 'safety',
    title: 'Safety',
    content: (
      <>
        <ul>
          <li><strong>Eye protection</strong> — Wear approved safety glasses. The beam and reflected light can damage eyes.</li>
          <li><strong>Ventilation</strong> — Keep the exhaust on. Do not bypass or block the fume extraction.</li>
          <li><strong>Never leave the machine unattended</strong> while it is running. Fires can start in seconds.</li>
          <li><strong>Know where the emergency stop</strong> is and how to use it.</li>
          <li><strong>No unknown materials</strong> — Only use materials that are approved for the machine. Some plastics release toxic fumes.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'protospace-etiquette',
    title: 'Protospace Etiquette',
    content: (
      <>
        <ul>
          <li>Clean up after yourself: remove scrap, wipe the bed if required, put tools back.</li>
          <li>Don&apos;t block exhaust or vents. Report any odd smells or smoke to staff.</li>
          <li>One person at the controls unless the space allows a buddy. No distractions near the machine while it&apos;s running.</li>
          <li>Ask before using someone else&apos;s material or changing machine settings.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'machine-specific',
    title: 'Xtool, Trotec, or Thunder',
    content: (tool: LaserTool) => {
      const name = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
      const toolNotes =
        tool === 'xtool'
          ? 'XTool uses Laserbox or XCS software; check bed size and material settings for your model.'
          : tool === 'trotec'
            ? 'Trotec uses JobControl; speed and power are in the material database. Ask for the job manager walkthrough.'
            : 'Thunder uses RDWorks or similar; focus and origin are set at the machine. Get a quick demo at the panel.';
      return (
        <>
          <p>You selected <strong>{name}</strong>. Protospace may have multiple brands; this deck is tailored to your choice.</p>
          <ul>
            <li><strong>Bed &amp; head</strong> — Flat bed, moving laser head, lens focus.</li>
            <li><strong>Control panel</strong> — Start, stop, pause, power/speed.</li>
            <li><strong>Exhaust</strong> — Must run during operation.</li>
          </ul>
          <p className="slide-note">{toolNotes}</p>
        </>
      );
    },
  },
  {
    id: 'safety-again',
    title: 'Safety again',
    content: (
      <>
        <p className="slide-lead">Before you run the machine, remember:</p>
        <ul>
          <li>Safety glasses on. Exhaust on. No unattended runs.</li>
          <li>Know the emergency stop. Only use approved materials.</li>
          <li>When in doubt, ask a staff member.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'whats-next',
    title: "What's next?",
    content: (tool: LaserTool) => {
      const name = tool === 'xtool' ? 'XTool' : tool === 'trotec' ? 'Trotec' : 'Thunder';
      return (
        <>
          <ul>
            <li>Hands-on at the <strong>{name}</strong>: loading files, power/speed, focus, and running a job.</li>
            <li>Materials and file prep (vector vs raster, cut vs engrave) on the machine you&apos;ll use.</li>
            <li>Cleanup and disposal. Where to find help and resources.</li>
          </ul>
          <p className="slide-lead">Have fun and make safely.</p>
        </>
      );
    },
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
