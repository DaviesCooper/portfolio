/**
 * RGB color value (0–1 per channel).
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Color key for the gradient: time in [0, 1] and RGB color.
 */
export interface GradientColorKey {
  time: number;
  color: RGB;
}

/**
 * Unity-style gradient: color keys only (RGB, no alpha).
 * Use addColorKey() to add keys, then evaluate(t) to sample at time t in [0, 1].
 */
export class Gradient {
  private _colorKeys: GradientColorKey[] = [];

  /** Number of color keys. */
  get colorKeyCount(): number {
    return this._colorKeys.length;
  }

  /**
   * Add a color key. Time should be in [0, 1]. Keys are kept sorted by time.
   */
  addColorKey(time: number, color: RGB): void {
    const clamped = Math.max(0, Math.min(1, time));
    const key: GradientColorKey = { time: clamped, color: { ...color } };
    const i = this._colorKeys.findIndex((k) => k.time > clamped);
    if (i < 0) this._colorKeys.push(key);
    else this._colorKeys.splice(i, 0, key);
  }

  /**
   * Set all color keys at once (replaces existing). Keys will be sorted by time.
   */
  setKeys(keys: GradientColorKey[]): void {
    this._colorKeys = [...keys]
      .map((k) => ({ time: Math.max(0, Math.min(1, k.time)), color: { ...k.color } }))
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Get a copy of the color key at index.
   */
  getColorKey(index: number): GradientColorKey | undefined {
    const k = this._colorKeys[index];
    return k ? { time: k.time, color: { ...k.color } } : undefined;
  }

  /**
   * Sample the gradient at time t in [0, 1]. Returns interpolated RGB.
   * Before first key: first color. After last key: last color.
   */
  evaluate(t: number): RGB {
    const keys = this._colorKeys;
    if (keys.length === 0) return { r: 0, g: 0, b: 0 };
    if (keys.length === 1) return { ...keys[0].color };

    const clamped = Math.max(0, Math.min(1, t));
    let i = 0;
    while (i < keys.length && keys[i].time < clamped) i++;

    if (i === 0) return { ...keys[0].color };
    if (i >= keys.length) return { ...keys[keys.length - 1].color };

    const a = keys[i - 1];
    const b = keys[i];
    const u = (clamped - a.time) / (b.time - a.time);
    return lerpRGB(a.color, b.color, u);
  }

  /**
   * Same as evaluate(t) but returns a CSS rgb(r, g, b) string with 0–255 values.
   */
  evaluateCSS(t: number): string {
    const { r, g, b } = this.evaluate(t);
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}
