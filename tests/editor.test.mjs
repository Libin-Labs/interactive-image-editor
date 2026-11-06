import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractiveImageEditor } from '../dist/esm/index.js';

const hotspots = [
  {
    id: 'details',
    label: 'View details',
    description: 'Open the product details.',
    x: 10,
    y: 10,
    width: 40,
    height: 30,
    action: { type: 'navigate', target: 'product-details' },
  },
  {
    id: 'zoom',
    label: 'Zoom feature',
    description: 'Read about the highlighted feature.',
    x: 20,
    y: 20,
    width: 20,
    height: 10,
    priority: 2,
    action: { type: 'navigate', target: 'feature-info' },
  },
];

test('hit tests image pixels, honors half-open edges, and resolves overlap by priority', () => {
  const editor = createInteractiveImageEditor(100, 80, hotspots);
  assert.equal(editor.hitTest(20, 20)?.id, 'zoom');
  assert.equal(editor.hitTest(39.999, 29.999)?.id, 'zoom');
  assert.equal(editor.hitTest(40, 30)?.id, 'details');
  assert.equal(editor.hitTest(50, 10), null);
  assert.equal(editor.hitTest(100, 80), null);
  assert.deepEqual(editor.activateAt(25, 25), {
    hotspot: { ...hotspots[1], priority: 2 },
    action: { type: 'navigate', target: 'feature-info' },
  });
});

test('equal-priority overlap is stable and hotspot lists are accessible detached data', () => {
  const entries = hotspots.map((item) => ({ ...item, priority: 0 }));
  const editor = createInteractiveImageEditor(100, 80, entries);
  assert.equal(editor.hitTest(25, 25)?.id, 'details');
  const listed = editor.listHotspots();
  assert.equal(listed[0].label, 'View details');
  assert.equal(listed[0].description, 'Open the product details.');
  listed[0].action.target = 'changed';
  assert.equal(editor.hitTest(10, 10)?.action.target, 'product-details');
});

test('rejects invalid dimensions, hotspot bounds, duplicate IDs, unsafe routes, and over-capacity input', () => {
  assert.throws(() => createInteractiveImageEditor(0, 10, []), RangeError);
  assert.throws(() => createInteractiveImageEditor(10, 10, [{ ...hotspots[0], x: 9 }]), RangeError);
  assert.throws(
    () => createInteractiveImageEditor(100, 80, [hotspots[0], hotspots[0]]),
    /Duplicate hotspot/,
  );
  assert.throws(
    () =>
      createInteractiveImageEditor(100, 80, [
        { ...hotspots[0], action: { type: 'navigate', target: 'https://example.com' } },
      ]),
    /safe identifier/,
  );
  assert.throws(
    () => createInteractiveImageEditor(100, 80, hotspots, { maxHotspots: 1 }),
    RangeError,
  );
  assert.throws(
    () => createInteractiveImageEditor(100, 80, [{ ...hotspots[0], x: NaN }]),
    RangeError,
  );
});
