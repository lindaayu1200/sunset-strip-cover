// Fixed scenes for screenshots and smoke tests: ?shot=cover renders the exported cover alone,
// ?shot=editor shows the studio with samples loaded, ?shot=export returns the PNG bytes.
// `photo` and `caption` pick the sample(s) and the words. window.__shotReady is set once painted.
import { exportCover } from './exporter.js';

export async function runShot(setup) {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (shot === 'export') document.body.classList.add('shot-export');

  const photos = (q.get('photo') ?? 'sunset-boulevard').split(',');
  const sample = (p) => `samples/${p}.jpg`;
  await setup(photos.map(sample), {
    title: q.get('caption') ?? 'SUNSET STRIP',
    subtitle: q.get('subtitle') ?? 'VICE CITY STORIES · VOL. 01',
    kicker: q.get('kicker') ?? 'THE COAST IS YOURS',
    layout: q.get('layout') ?? 'grid4',
    grade: q.get('grade') ?? 'vice',
    lettering: q.get('lettering') ?? 'slab',
    ink: q.get('ink') ?? 'white',
    size: q.get('size') ?? '1080x1080',
  });

  if (shot === 'export') {
    const state = window.__coverState();
    const { blob } = await exportCover(state, state.size);
    const buf = await blob.arrayBuffer();
    let bin = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    window.__shotPng = btoa(bin);
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__shotReady = true;
}
