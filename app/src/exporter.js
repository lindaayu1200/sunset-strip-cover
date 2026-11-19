// Export the cover as a PNG in the three common post sizes.
import { renderCover } from './engine.js';

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: 'Square' },
  '1080x1350': { w: 1080, h: 1350, label: 'Poster' },
  '1920x1080': { w: 1920, h: 1080, label: 'Wide' },
};

/** Renders `state` into a fresh canvas of the chosen size and hands back a PNG blob. */
export async function exportCover(state, sizeId) {
  const { w, h } = SIZES[sizeId] ?? SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  await fontsReady();
  renderCover(ctx, w, h, state);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { blob, name: `cover-${w}x${h}.png` };
}

function fontsReady() {
  return Promise.all([
    document.fonts.load('700 48px "Anton"'),
    document.fonts.load('400 48px "Bebas Neue"'),
  ]).catch(() => {});
}

/** Triggers a browser download of a blob and returns the file name it saved as. */
export function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
