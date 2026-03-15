import { ColumnSlide } from '../components/layouts/ColumnSlide';
import { defineSlide } from './defineSlide';
import { useLaserTool } from '../context/LaserToolContext';

function Slide12(): JSX.Element {
  const {tool} = useLaserTool();
  return (
    <ColumnSlide
      left={
        <div>
          <p>There is no risk of fire.</p>
          <p>There is a guarantee of fire.</p>
        </div>
      }
      right={
        <div>
          <p>
            <ul>NEVER leave the laser cutter unattended.</ul>
            <ul>NEVER put chlorine in the machine.</ul>
            {tool === "xtool" && (
                <ul>NEVER disable the lid interlock.</ul>
            )}
          </p>
        </div>
      }
    />
  );
}

export default defineSlide(Slide12, {
  id: 'safety',
  title: 'Safety',
});
