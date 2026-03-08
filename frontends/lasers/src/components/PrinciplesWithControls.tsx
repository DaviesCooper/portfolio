import { useState } from 'react';
import { useLaserTool } from '../context/LaserToolContext';
import { BurnSimulation } from './BurnSimulation';
import { PowerSlider } from './PowerSlider';
import './PrinciplesWithControls.css';

export function PrinciplesWithControls(): JSX.Element {
  const { tool } = useLaserTool();
  const [power, setPower] = useState(50);
  const [laserType, setLaserType] = useState<'ir' | 'blue'>('ir');
  const isXTool = tool === 'xtool';

  return (
    <div className="slide-two-col">
      <div className="slide-two-col-left">
        <p>
          We can control how much energy is deposited into the material by controlling the power of the laser, or by controlling the speed of the laser.
        </p>
        {isXTool && (
          <p>
            In addition we can control the type of laser we use, as well as the frequency of the laser.
            This is only useful for XTool, as it is the only laser that can be switched between types.
            The types of lasers the XTool can use are IR and Blue Light.
            IR lasers are used for metal.
            Blue light lasers are used for wood and plastic.
          </p>
        )}
      </div>
      <div className="slide-two-col-right">
        <BurnSimulation
          power={power}
          laserType={isXTool ? laserType : undefined}
        >
          <div className="principles-controls">
            <div className="principles-control principles-control-power">
              <span className="principles-control-label">Power</span>
              <PowerSlider
                value={power}
                onChange={setPower}
                aria-label="Laser power 0 to 100"
              />
            </div>
            {isXTool && (
              <div className="principles-control principles-control-laser-type">
                <span className="principles-control-label">Laser Type</span>
                <div className="principles-laser-type-toggle-wrap">
                  <span className={`principles-laser-type-option-label ${laserType === 'ir' ? 'active' : ''}`}>
                    IR
                  </span>
                  <button
                    type="button"
                    className="principles-laser-type-toggle"
                    role="switch"
                    aria-checked={laserType === 'blue'}
                    aria-label="Laser type"
                    onClick={() => setLaserType((prev) => (prev === 'ir' ? 'blue' : 'ir'))}
                  >
                    <span className={`principles-laser-type-segment ${laserType === 'ir' ? 'active' : ''}`} />
                    <span className={`principles-laser-type-segment ${laserType === 'blue' ? 'active' : ''}`} />
                  </button>
                  <span className={`principles-laser-type-option-label ${laserType === 'blue' ? 'active' : ''}`}>
                    Blue light
                  </span>
                </div>
              </div>
            )}
          </div>
        </BurnSimulation>
      </div>
    </div>
  );
}
