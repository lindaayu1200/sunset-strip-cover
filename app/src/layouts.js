// Panel layouts for the cover. Every rect is normalized (0..1 of the cover box) with a
// small gutter kept between panels; `band` says where the lettering sits.

export const LAYOUTS = {
  grid4: {
    id: 'grid4',
    name: 'Four panels',
    band: 'bottom',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.5 },
      { x: 0.0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  spotlight: {
    id: 'spotlight',
    name: 'Spotlight',
    band: 'bottom',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 0.72 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.36 },
      { x: 0.62, y: 0.36, w: 0.38, h: 0.36 },
      { x: 0.0, y: 0.72, w: 0.62, h: 0.28 },
    ],
  },
  strip3: {
    id: 'strip3',
    name: 'Strip of three',
    band: 'bottom',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.3 },
      { x: 0.0, y: 0.3, w: 1.0, h: 0.3 },
      { x: 0.0, y: 0.6, w: 1.0, h: 0.3 },
    ],
  },
  cinema: {
    id: 'cinema',
    name: 'Full bleed',
    band: 'bottom',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 0.82 }],
  },
  duo: {
    id: 'duo',
    name: 'Duo split',
    band: 'bottom',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.82 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.82 },
    ],
  },
};

/** Panels of `layout` at cover size [w, h]: gutter insets between panels, lettering band at the foot. */
export function panelRects(layout, w, h, gutter, bandH) {
  const usable = layout.band === 'none' ? 1 : 1 - bandH / h;
  return layout.panels.map((p) => {
    const x = p.x * w + (p.x > 0 ? gutter / 2 : 0);
    const y = p.y * usable * h + (p.y > 0 ? gutter / 2 : 0);
    const right = (p.x + p.w) * w - (p.x + p.w < 1 ? gutter / 2 : 0);
    const bottom = (p.y + p.h) * usable * h - (p.y + p.h < 1 ? gutter / 2 : 0);
    return { x: Math.round(x), y: Math.round(y), w: Math.max(1, Math.round(right - x)), h: Math.max(1, Math.round(bottom - y)) };
  });
}
