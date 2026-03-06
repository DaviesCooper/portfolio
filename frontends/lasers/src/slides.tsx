import type { SlideData, SlideSource } from './types';
import { getSlideLabel } from './types';

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
      <p className="slide-lead">The theory behind laser CNC machines.</p>
    ),
  },
  {
    id: 'safety',
    title: 'Safety first',
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
    id: 'overview',
    title: 'Machine overview',
    content: (
      <>
        <p>Typical laser cutter layout:</p>
        <ul>
          <li><strong>Bed</strong> — Flat surface where material sits. Keep it clean and level.</li>
          <li><strong>Laser head</strong> — Moves in X and Y. The lens focuses the beam; keep it clean.</li>
          <li><strong>Control panel</strong> — Start, stop, pause, and sometimes power/speed presets.</li>
          <li><strong>Exhaust / duct</strong> — Removes smoke and fumes. Must run during operation.</li>
        </ul>
        <p className="slide-note">Your makerspace may use different brands (Epilog, Glowforge, Trotec, etc.). Ask staff for a machine-specific walkthrough.</p>
      </>
    ),
  },
  {
    id: 'materials',
    title: 'Materials',
    content: (
      <>
        <p><strong>Generally safe to cut/engrave:</strong></p>
        <ul>
          <li>Wood, plywood, MDF (uncoated)</li>
          <li>Acrylic (cast, not extruded when possible)</li>
          <li>Paper, cardstock, cardboard</li>
          <li>Some fabrics (cotton, leather)</li>
          <li>Anodized or coated metals (engrave only, not cut)</li>
        </ul>
        <p><strong>Do not use:</strong> PVC, vinyl, polycarbonate, or any material that produces chlorine or other toxic fumes. When in doubt, ask staff.</p>
      </>
    ),
  },
  {
    id: 'files',
    title: 'File preparation',
    content: (
      <>
        <p>Laser cutters read <strong>vector paths</strong> for cuts and sometimes <strong>raster images</strong> for engraving.</p>
        <ul>
          <li><strong>Recommended:</strong> SVG, DXF, or AI. Export from your design tool with strokes as paths, not as raster.</li>
          <li><strong>Cut vs engrave:</strong> Cuts go through the material (one line = one pass). Engraving uses filled areas or raster; power/speed control depth or darkness.</li>
          <li>Use the machine's software (or the driver) to assign <strong>power, speed, and frequency</strong> to each color or layer.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'settings',
    title: 'Power, speed & frequency',
    content: (
      <>
        <ul>
          <li><strong>Power</strong> — Laser intensity. Higher = deeper cut or darker engrave. Too high can cause burning or fire.</li>
          <li><strong>Speed</strong> — How fast the head moves. Slower = deeper cut. Faster = lighter engrave or score.</li>
          <li><strong>Frequency (PPI)</strong> — Pulses per inch. Higher often gives a smoother edge on some materials; lower can reduce charring. Not all machines expose this.</li>
        </ul>
        <p className="slide-note">Start with your makerspace's material settings sheet. Test on a small scrap before running a full job.</p>
      </>
    ),
  },
  {
    id: 'running',
    title: 'Running a job',
    content: (
      <>
        <ol>
          <li>Load your file in the machine software and assign settings to each layer/color.</li>
          <li>Place material flat on the bed and secure if needed. Close the lid.</li>
          <li>Focus the laser (auto or manual, per machine). Wrong focus = weak or inconsistent cuts.</li>
          <li>Position the origin (home) where you want the job to start.</li>
          <li>Start the job and <strong>watch the first minute</strong>. If something looks wrong (smoke, smell, misalignment), hit stop.</li>
        </ol>
      </>
    ),
  },
  {
    id: 'after',
    title: 'After the cut',
    content: (
      <>
        <ul>
          <li>Let the exhaust run for a short time after the job to clear fumes.</li>
          <li>Remove material and any debris. Check the bed for residue or damage.</li>
          <li>Clean the lens and bed if your makerspace requires it.</li>
          <li>Dispose of scrap and waste according to your space's rules.</li>
        </ul>
        <p className="slide-lead">When in doubt, ask a staff member. Have fun and make safely.</p>
      </>
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
