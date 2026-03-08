import { useCallback, useMemo, useRef, useState } from 'react';
import type { LaserTool } from '../types';
import { PowerKnob } from './PowerKnob';
import './KerfSimulation.css';

const SVG_WIDTH = 320;
const SVG_HEIGHT = 260;
const MAT_TOP = 120;
const MAT_BOTTOM = 210;
const MAT_LEFT = 0;
const MAT_RIGHT = SVG_WIDTH;
const HEAD_MIN_Y = 18;
const HEAD_MAX_Y = 115;
const HEAD_MIN_X = 15;
const HEAD_MAX_X = 300;
/** When XTool (galvo): head is fixed near top of canvas */
const XTOOL_HEAD_Y = 28;
const FOCAL_LENGTH_MIN = 25;
const FOCAL_LENGTH_MAX = 250;
/** Beam half-angle scale: tan(halfAngle) ≈ BEAM_RADIUS_AT_LENS / focalLength (larger = wider beam at head) */
const BEAM_RADIUS_AT_LENS = 10;

/** Focal point from head and (for XTool) beam angle. Angle in radians, 0 = straight down, positive = tilt right. */
function getFocal(
  headX: number,
  headY: number,
  focalLength: number,
  beamAngle: number
): { fx: number; fy: number } {
  return {
    fx: headX + focalLength * Math.sin(beamAngle),
    fy: headY + focalLength * Math.cos(beamAngle),
  };
}

/** Beam half-angle from focal length (narrower beam with longer FL). */
function beamHalfAngle(focalLength: number): number {
  return Math.atan(BEAM_RADIUS_AT_LENS / focalLength);
}

/** Beam left/right x at vertical position y, for a cone through (fx, fy) with half-angle theta and center tilt phi. */
function beamEdgesAtY(
  fx: number,
  fy: number,
  y: number,
  phi: number,
  theta: number
): { left: number; right: number } {
  const dy = y - fy;
  const left = fx + dy * Math.tan(phi - theta);
  const right = fx + dy * Math.tan(phi + theta);
  return { left: Math.min(left, right), right: Math.max(left, right) };
}

/** Max beam width (kerf) within material and the y where it occurs. */
function kerfInMaterial(
  fx: number,
  fy: number,
  phi: number,
  theta: number
): { kerfPx: number; atY: number; left: number; right: number } {
  const yTop = MAT_TOP;
  const yBottom = MAT_BOTTOM;
  const atTop = beamEdgesAtY(fx, fy, yTop, phi, theta);
  const atBottom = beamEdgesAtY(fx, fy, yBottom, phi, theta);
  const widthTop = atTop.right - atTop.left;
  const widthBottom = atBottom.right - atBottom.left;
  if (widthTop >= widthBottom) {
    return {
      kerfPx: widthTop,
      atY: yTop,
      left: atTop.left,
      right: atTop.right,
    };
  }
  return {
    kerfPx: widthBottom,
    atY: yBottom,
    left: atBottom.left,
    right: atBottom.right,
  };
}

export interface KerfSimulationProps {
  tool: LaserTool;
}

export function KerfSimulation({ tool }: KerfSimulationProps): JSX.Element {
  const isXTool = tool === 'xtool';

  const [headX, setHeadX] = useState(160);
  const [headY, setHeadY] = useState(75);
  const [focalLengthNorm, setFocalLengthNorm] = useState(50); // 0–100
  const [beamAngleDeg, setBeamAngleDeg] = useState(0); // XTool: degrees, -30 to 30

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, headX: 0, headY: 0 });

  const focalLength =
    FOCAL_LENGTH_MIN +
    (FOCAL_LENGTH_MAX - FOCAL_LENGTH_MIN) * (focalLengthNorm / 100);
  const beamAngleRad = (beamAngleDeg * Math.PI) / 180;
  const theta = beamHalfAngle(focalLength);
  const effectiveHeadX = headX;
  const effectiveHeadY = isXTool ? XTOOL_HEAD_Y : headY;
  const { fx, fy } = getFocal(effectiveHeadX, effectiveHeadY, focalLength, beamAngleRad);

  const kerf = useMemo(
    () => kerfInMaterial(fx, fy, beamAngleRad, theta),
    [fx, fy, beamAngleRad, theta]
  );

  const beamLines = useMemo(() => {
    /* Extend beam past bottom of canvas so it is always clipped (bottom off canvas) */
    const extend = 320;
    const leftTan = Math.tan(beamAngleRad - theta);
    const rightTan = Math.tan(beamAngleRad + theta);
    const headToFocalY = effectiveHeadY - fy;
    const leftAtHeadX = fx + headToFocalY * leftTan;
    const rightAtHeadX = fx + headToFocalY * rightTan;
    const leftAbove = { x: leftAtHeadX, y: effectiveHeadY };
    const rightAbove = { x: rightAtHeadX, y: effectiveHeadY };
    const leftBelow = {
      x: fx + extend * Math.sin(beamAngleRad - theta),
      y: fy + extend * Math.cos(beamAngleRad - theta),
    };
    const rightBelow = {
      x: fx + extend * Math.sin(beamAngleRad + theta),
      y: fy + extend * Math.cos(beamAngleRad + theta),
    };
    return { leftAbove, leftBelow, rightAbove, rightBelow };
  }, [fx, fy, effectiveHeadY, beamAngleRad, theta]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isXTool || e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        headX,
        headY,
      };
      setIsDragging(true);
    },
    [isXTool, headX, headY]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isXTool && isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setHeadX(
          Math.max(HEAD_MIN_X, Math.min(HEAD_MAX_X, dragStartRef.current.headX + dx))
        );
        setHeadY(
          Math.max(HEAD_MIN_Y, Math.min(HEAD_MAX_Y, dragStartRef.current.headY + dy))
        );
      }
    },
    [isXTool, isDragging]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
    },
    []
  );

  const focusLabel =
    fy <= MAT_TOP ? 'Surface-focused' : fy >= MAT_BOTTOM ? 'Bottom-focused' : 'Center-focused';

  return (
    <div className="kerf-sim">
      <div className="kerf-sim-row">
        <div className="kerf-sim-svg-wrap">
          <svg
            className="kerf-sim-svg"
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            aria-label="Side view of laser beam and material; kerf is the maximum beam width inside the material"
          >
            <defs>
              <linearGradient
                id="kerf-mat-fill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="var(--kerf-mat-top)" />
                <stop offset="100%" stopColor="var(--kerf-mat-bottom)" />
              </linearGradient>
            </defs>
            {/* Kerf value in top right (on canvas to avoid caption resizing / flicker) */}
            <text
              x={SVG_WIDTH - 12}
              y={22}
              textAnchor="end"
              className="kerf-sim-value-text"
              aria-hidden
            >
              {kerf.kerfPx.toFixed(1)} px
            </text>
            {/* Material */}
            <rect
              x={MAT_LEFT}
              y={MAT_TOP}
              width={MAT_RIGHT - MAT_LEFT}
              height={MAT_BOTTOM - MAT_TOP}
              fill="url(#kerf-mat-fill)"
              stroke="var(--border)"
              strokeWidth="1.5"
            />
            {/* Beam: left edge */}
            <line
              x1={beamLines.leftAbove.x}
              y1={beamLines.leftAbove.y}
              x2={beamLines.leftBelow.x}
              y2={beamLines.leftBelow.y}
              className="kerf-beam-edge"
              stroke="var(--kerf-beam)"
              strokeWidth="2"
            />
            {/* Beam: right edge */}
            <line
              x1={beamLines.rightAbove.x}
              y1={beamLines.rightAbove.y}
              x2={beamLines.rightBelow.x}
              y2={beamLines.rightBelow.y}
              className="kerf-beam-edge"
              stroke="var(--kerf-beam)"
              strokeWidth="2"
            />
            {/* Focal point */}
            <circle
              cx={fx}
              cy={fy}
              r="3"
              fill="var(--kerf-beam)"
              aria-hidden
            />
            {/* Kerf brace */}
            <line
              x1={kerf.left}
              y1={kerf.atY}
              x2={kerf.right}
              y2={kerf.atY}
              className="kerf-brace-line"
              stroke="var(--fg)"
              strokeWidth="2"
            />
            <line x1={kerf.left} y1={kerf.atY} x2={kerf.left} y2={kerf.atY + 8} stroke="var(--fg)" strokeWidth="1.5" />
            <line x1={kerf.right} y1={kerf.atY} x2={kerf.right} y2={kerf.atY + 8} stroke="var(--fg)" strokeWidth="1.5" />
            {/* Laser head (draggable for non-XTool) */}
            <g
              role={isXTool ? undefined : 'button'}
              aria-label={isXTool ? undefined : 'Laser head; drag to move'}
              tabIndex={isXTool ? undefined : 0}
              className={`kerf-head ${isDragging ? 'dragging' : ''} ${isXTool ? 'fixed' : 'draggable'}`}
              transform={`translate(${effectiveHeadX}, ${effectiveHeadY})`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              <circle r="10" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
            </g>
          </svg>
          <p className="kerf-sim-caption">
            Max width in material · {focusLabel}
          </p>
        </div>
        <div className="kerf-sim-controls">
          <div className="kerf-sim-control">
            <span className="kerf-sim-control-label">Focal length</span>
            <PowerKnob
              value={focalLengthNorm}
              onChange={setFocalLengthNorm}
              aria-label="Focal length"
            />
          </div>
          {isXTool && (
            <div className="kerf-sim-control">
              <span className="kerf-sim-control-label">Beam angle (galvo)</span>
              <input
                type="range"
                min={-30}
                max={30}
                value={beamAngleDeg}
                onChange={(e) => setBeamAngleDeg(Number(e.target.value))}
                className="kerf-sim-angle-slider"
                aria-label="Beam angle"
              />
              <span className="kerf-sim-angle-value">{beamAngleDeg}°</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
