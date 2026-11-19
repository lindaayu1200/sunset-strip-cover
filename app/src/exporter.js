// Export sizes and PNG helpers. No network access: everything is drawn locally.

import { renderCover } from './engine.js';

export const SIZES = {
  square: { id: 'square', name: '1080 x 1080', w: 1080, h: 1080 },
  poster: { id: 'poster', name: '1080 x 1350', w: 1080, h: 1350 },
  wide: { id: 'wide', name: '1920 x 1080', w: 1920, h: 1080 }
};

function makeCanvas(w, h) {
  if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    return canvas;
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(w, h);
  }
  throw new Error('No canvas implementation is available');
}

// Draw a fresh cover at exactly w x h and hand the canvas back.
export function renderAt(state, w, h) {
  const canvas = makeCanvas(w, h);
  renderCover(canvas, w, h, state);
  return canvas;
}

// Read SIZES[sizeId], call renderCover on an offscreen canvas of that size,
// canvasToBlob the PNG, return { blob, w, h }.
export async function exportCover(state, sizeId) {
  const size = SIZES[sizeId];
  if (!size) throw new Error('Unknown size: ' + sizeId);
  const canvas = makeCanvas(size.w, size.h);
  renderCover(canvas, size.w, size.h, state);

  let blob;
  if (typeof canvas.convertToBlob === 'function') {
    blob = await canvas.convertToBlob({ type: 'image/png' });
  } else if (typeof canvas.toBlob === 'function') {
    blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the cover as PNG'))), 'image/png');
    });
  } else {
    throw new Error('Canvas cannot encode a PNG');
  }

  return { blob, w: size.w, h: size.h };
}

export function canvasToBlob(canvas, type) {
  if (typeof canvas.convertToBlob === 'function') {
    return canvas.convertToBlob({ type: type || 'image/png' });
  }
  if (typeof canvas.toBlob === 'function') {
    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the cover as PNG'))), type || 'image/png');
    });
  }
  return Promise.reject(new Error('Canvas cannot encode a PNG'));
}

// Resolve with a PNG Blob for the given size. Works with HTML and offscreen canvases.
export function exportBlob(state, w, h) {
  return new Promise((resolve, reject) => {
    let canvas;
    try {
      canvas = renderAt(state, w, h);
    } catch (error) {
      reject(error);
      return;
    }

    if (typeof canvas.convertToBlob === 'function') {
      canvas.convertToBlob({ type: 'image/png' }).then(resolve, reject);
      return;
    }

    if (typeof canvas.toBlob !== 'function') {
      reject(new Error('Canvas cannot encode a PNG'));
      return;
    }

    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the cover as PNG'));
    }, 'image/png');
  });
}
