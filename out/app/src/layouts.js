// Panel geometry for the cover layouts.
// All rectangles are expressed in canvas pixels and stay inside [0, w] x [0, h].

export const LAYOUTS = {
  grid4: { id: 'grid4', name: 'Four panels', letteringBand: 0.26 },
  spotlight: { id: 'spotlight', name: 'Spotlight' },
  strip3: { id: 'strip3', name: 'Three strip', letteringBand: 0.24 },
  cinema: { id: 'cinema', name: 'Cinema' },
  duo: { id: 'duo', name: 'Duo', letteringBand: 0.28 },
  none: { id: 'none', name: 'None' }
};

export function layoutPanels(id, w, h) {
  const layout = LAYOUTS[id];
  if (!layout || id === 'none' || !(w > 0) || !(h > 0)) return [];

  // The lettering band is measured as a fraction of the whole cover height.
  const band = typeof layout.letteringBand === 'number' ? layout.letteringBand : 0;
  const areaH = h * (1 - band);

  // Gaps are tied to the short side so they read consistently at any size.
  // The clamps keep every rectangle positive even for extreme aspect ratios.
  const gap = Math.min(0.012 * Math.min(w, h), w / 10, areaH / 10);

  if (id === 'cinema') {
    return [{ x: 0, y: 0, w: w, h: areaH }];
  }

  if (id === 'grid4') {
    const colW = (w - gap) / 2;
    const rowH = (areaH - gap) / 2;
    return [
      { x: 0, y: 0, w: colW, h: rowH },
      { x: colW + gap, y: 0, w: colW, h: rowH },
      { x: 0, y: rowH + gap, w: colW, h: rowH },
      { x: colW + gap, y: rowH + gap, w: colW, h: rowH }
    ];
  }

  if (id === 'spotlight') {
    const leftW = w * 0.62 - gap / 2;
    const rightX = leftW + gap;
    const rightW = w - rightX;
    const topH = (areaH - gap) / 2;
    const bottomY = topH + gap;
    return [
      { x: 0, y: 0, w: leftW, h: areaH },
      { x: rightX, y: 0, w: rightW, h: topH },
      { x: rightX, y: bottomY, w: rightW, h: areaH - bottomY }
    ];
  }

  if (id === 'strip3') {
    const stripW = (w - 2 * gap) / 3;
    return [0, 1, 2].map(function (i) {
      return { x: i * (stripW + gap), y: 0, w: stripW, h: areaH };
    });
  }

  if (id === 'duo') {
    const bandH = (areaH - gap) / 2;
    const bottomY = bandH + gap;
    return [
      { x: 0, y: 0, w: w, h: bandH },
      { x: 0, y: bottomY, w: w, h: areaH - bottomY }
    ];
  }

  return [];
}
