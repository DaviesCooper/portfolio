import { useState } from 'react';
import { useLaserTool } from '../context/LaserToolContext';
import { BurnSimulation } from './BurnSimulation';
import { PowerKnob } from './PowerKnob';
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
          The point of using a laser is so that we can control how much energy is deposited into the material.
          We can do this by controlling the power of the laser.

          We can also control the speed of the laser.
          The speed of the laser is controlled by the speed of the material.
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
        <div className="principles-sim-row">
          <BurnSimulation
            power={power}
            laserType={isXTool ? laserType : undefined}
          />
          <div className="principles-controls">
            <div className="principles-control principles-control-power">
              <span className="principles-control-label">Power</span>
              <PowerKnob
                value={power}
                onChange={setPower}
                aria-label="Laser power 0 to 100"
              />
            </div>
            {isXTool && (
              <div className="principles-control principles-control-laser-type">
                <span className="principles-control-label">Laser type</span>
                <div
                  className="principles-laser-type-toggle"
                  role="tablist"
                  aria-label="Laser type"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={laserType === 'ir'}
                    aria-label="IR laser"
                    className={`principles-laser-type-segment ${laserType === 'ir' ? 'active' : ''}`}
                    onClick={() => setLaserType('ir')}
                  >
                    IR
                  </button>
                  <div />
                  <button
                    type="button"
                    role="tab"
                    aria-selected={laserType === 'blue'}
                    aria-label="Blue light laser"
                    className={`principles-laser-type-segment ${laserType === 'blue' ? 'active' : ''}`}
                    onClick={() => setLaserType('blue')}
                  >
                    Blue light
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
