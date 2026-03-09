import type { SlideComponentProps } from '../lib';
import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';

function Slide9({ tool }: SlideComponentProps): JSX.Element {
  const resolutionPpi = tool === 'trotec' ? 1000 : tool === 'thunder' ? 500 : 762;
  const toolName = tool === 'trotec' ? 'Trotec' : tool === 'thunder' ? 'Thunder' : 'XTool';
  return (
    <ColumnSlide
      left={
        <>
          <p>
            When following a path, the laser will move in small increments. The smaller the
            increments, the more accurate the path will be. The more increments, the longer it will
            take to complete the path. The maximum resolution is limited by the machine itself.
            These steps are typically referred to as pixels per inch (PPI), or dots per inch (DPI).
          </p>
          <p>
            The {toolName} has a maximum resolution of {resolutionPpi} ppi.
          </p>
        </>
      }
      right={
        <p>(Resolution limit simulation placeholder)</p>
      }
    />
  );
}

export default defineSlide(Slide9, {
  id: 'principles-controls-resolution',
  title: 'Principles of Laser CNC Machines',
});
