import type { LaserTool } from '../lib';
import { useLaserTool } from '../context/LaserToolContext';
import { TriSelect, type TriSelectIndex } from '../components/controls/TriSelect';
import { defineSlide } from './defineSlide';

const TOOLS: readonly [LaserTool, LaserTool, LaserTool] = ['xtool', 'trotec', 'thunder'];

function toolToIndex(tool: LaserTool): TriSelectIndex {
  const i = TOOLS.indexOf(tool);
  return (i >= 0 ? i : 0) as TriSelectIndex;
}

function Slide2(): JSX.Element {
  const { tool, setTool } = useLaserTool();
  const index = toolToIndex(tool);

  return (
    <>
      <p className="tool-slider-label">Select which laser</p>
      <TriSelect
        value={index}
        onChange={(i) => setTool(TOOLS[i])}
        options={['XTool', 'Trotec', 'Thunder']}
        aria-label="Laser machine"
      />
    </>
  );
}

export default defineSlide(Slide2, {
  id: 'title',
  title: 'Protospace',
  subtitle: 'Lasers',
});
