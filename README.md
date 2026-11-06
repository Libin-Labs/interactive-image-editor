# @lp-labs/interactive-image-editor

A dependency-free, headless model for image hotspots. It performs actual point-in-rectangle hit
testing, returns a deterministic navigation action, and exposes a labeled/annotated hotspot list
that a host can render as an accessible alternative to pointer interaction.

## Install and quick start

```sh
npm install @lp-labs/interactive-image-editor
```

```js
import { createInteractiveImageEditor } from '@lp-labs/interactive-image-editor';

const editor = createInteractiveImageEditor(1200, 800, [
  {
    id: 'lens',
    label: 'Camera lens',
    description: 'Open information about the camera lens.',
    x: 700,
    y: 260,
    width: 120,
    height: 100,
    action: { type: 'navigate', target: 'camera-details' },
  },
]);
console.log(editor.hitTest(740, 300));
console.log(editor.activateAt(740, 300)?.action);
console.log(editor.listHotspots());
```

## API, types, and customization

- `createInteractiveImageEditor(width, height, hotspots, options?)` validates and snapshots image
  dimensions and hotspots. Geometry is in source-image pixel coordinates, not CSS coordinates.
- Each `ImageHotspotInput` supplies a unique `id`, visible `label`, `description`, `x`, `y`,
  positive `width`/`height`, optional integer `priority`, and `{ type: 'navigate', target }`.
  Targets are safe internal identifiers, not URLs, scripts, or arbitrary navigation commands.
- `hitTest(x, y)` performs actual rectangular hit testing. Rectangles use half-open edges
  `[x, x + width)` and `[y, y + height)`. Higher priority wins; ties use input order.
  `activateAt` returns the hit hotspot with its modeled action, or `null`.
- `listHotspots()` returns detached hotspot/action data for an accessible list or other host UI.
- `ImageHotspotAction`, `ImageHotspotInput`, `ImageHotspot`, `ImageEditorOptions`,
  `ImageHotspotHit`, and `InteractiveImageEditor` are exported types.
- `maxHotspots` defaults to 1000 and may be configured from 0 to 10000. Image dimensions are
  bounded at 10 million pixels per side; strings and safe identifiers are validated.
- Invalid records, text, IDs, and actions throw `TypeError`; out-of-bounds or non-finite geometry,
  unsafe priority values, and capacity violations throw `RangeError`. Hit testing scans at most
  10000 hotspots (`O(n)`); listing is `O(n)`. Returned data is detached.

## Interoperability and scope

This package is a pure data and geometry model: it has no image decoding, DOM, rendering,
keyboard handling, focus management, or browser navigation. Host applications must render the
image and provide keyboard/screen-reader controls using the returned labels/descriptions. The
navigation action is a safe route token for the host to resolve; this package never follows it.
Overlapping hotspots are intentional and resolved deterministically. ESM, CommonJS, and TypeScript
declarations are included. There are no runtime or peer dependencies; TypeScript and Prettier are
development-only.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
