import type { LaserTool } from '../types';
import { useLaserTool } from '../context/LaserToolContext';
import './ToolSlider.css';

const TOOLS: readonly LaserTool[] = ['xtool', 'trotec', 'thunder'] as const;
const TOOL_LABELS: Record<LaserTool, string> = {
  xtool: 'XTool',
  trotec: 'Trotec',
  thunder: 'Thunder',
};

export function ToolSlider(): JSX.Element {
  const { tool, setTool } = useLaserTool();

  return (
    <div
      className="tool-slider"
      role="tablist"
      aria-label="Select laser machine"
    >
      {TOOLS.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === tool}
          aria-label={`${TOOL_LABELS[t]} laser`}
          className={`tool-slider-segment ${t === tool ? 'active' : ''}`}
          onClick={() => setTool(t)}
        >
          {TOOL_LABELS[t]}
        </button>
      ))}
    </div>
  );
}
