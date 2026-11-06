export interface ImageHotspotAction {
  readonly type: 'navigate';
  readonly target: string;
}

export interface ImageHotspotInput {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly priority?: number;
  readonly action: ImageHotspotAction;
}

export interface ImageHotspot extends ImageHotspotInput {
  readonly priority: number;
}

export interface ImageEditorOptions {
  readonly maxHotspots?: number;
}

export interface ImageHotspotHit {
  readonly hotspot: ImageHotspot;
  readonly action: ImageHotspotAction;
}

export interface InteractiveImageEditor {
  readonly width: number;
  readonly height: number;
  listHotspots(): ImageHotspot[];
  hitTest(x: number, y: number): ImageHotspot | null;
  activateAt(x: number, y: number): ImageHotspotHit | null;
}

const ID = /^[A-Za-z][A-Za-z0-9_.-]{0,127}$/;
const MAX_DIMENSION = 10_000_000;

function assertId(value: unknown, name: string): asserts value is string {
  if (
    typeof value !== 'string' ||
    !ID.test(value) ||
    ['constructor', 'prototype', '__proto__'].includes(value)
  ) {
    throw new TypeError(`${name} must be a safe identifier.`);
  }
}

function assertText(value: unknown, name: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2000) {
    throw new TypeError(`${name} must be nonempty text of at most 2000 characters.`);
  }
}

function coordinate(value: unknown, name: string, positive = false): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (positive && value === 0) ||
    value > MAX_DIMENSION
  ) {
    throw new RangeError(
      `${name} must be a finite ${positive ? 'positive' : 'nonnegative'} number.`,
    );
  }
  return value;
}

function copy(hotspot: ImageHotspot): ImageHotspot {
  return { ...hotspot, action: { ...hotspot.action } };
}

export function createInteractiveImageEditor(
  width: number,
  height: number,
  input: readonly ImageHotspotInput[],
  options: ImageEditorOptions = {},
): InteractiveImageEditor {
  const imageWidth = coordinate(width, 'width', true);
  const imageHeight = coordinate(height, 'height', true);
  const maxHotspots = options.maxHotspots ?? 1000;
  if (!Number.isSafeInteger(maxHotspots) || maxHotspots < 0 || maxHotspots > 10_000) {
    throw new RangeError('maxHotspots must be an integer from 0 to 10000.');
  }
  if (!Array.isArray(input) || input.length > maxHotspots) {
    throw new RangeError('Hotspots must be an array within maxHotspots.');
  }
  const ids = new Set<string>();
  const hotspots = input.map((item): ImageHotspot => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new TypeError('Each hotspot must be a plain data object.');
    }
    assertId(item.id, 'Hotspot ID');
    assertText(item.label, 'Hotspot label');
    assertText(item.description, 'Hotspot description');
    if (ids.has(item.id)) throw new TypeError(`Duplicate hotspot ID: ${item.id}`);
    ids.add(item.id);
    const x = coordinate(item.x, 'x');
    const y = coordinate(item.y, 'y');
    const hotspotWidth = coordinate(item.width, 'hotspot width', true);
    const hotspotHeight = coordinate(item.height, 'hotspot height', true);
    if (x + hotspotWidth > imageWidth || y + hotspotHeight > imageHeight) {
      throw new RangeError(`Hotspot ${item.id} extends beyond the image.`);
    }
    const priority = item.priority ?? 0;
    if (!Number.isSafeInteger(priority) || Math.abs(priority) > 1_000_000) {
      throw new RangeError('Hotspot priority must be a bounded safe integer.');
    }
    if (!item.action || typeof item.action !== 'object' || item.action.type !== 'navigate') {
      throw new TypeError('Hotspot action must be a safe navigate action.');
    }
    assertId(item.action.target, 'Navigation target');
    return {
      id: item.id,
      label: item.label,
      description: item.description,
      x,
      y,
      width: hotspotWidth,
      height: hotspotHeight,
      priority,
      action: { type: 'navigate', target: item.action.target },
    };
  });

  const at = (x: number, y: number): ImageHotspot | null => {
    const pointX = coordinate(x, 'hit-test x');
    const pointY = coordinate(y, 'hit-test y');
    if (pointX >= imageWidth || pointY >= imageHeight) return null;
    const winner = hotspots
      .filter(
        (hotspot) =>
          pointX >= hotspot.x &&
          pointX < hotspot.x + hotspot.width &&
          pointY >= hotspot.y &&
          pointY < hotspot.y + hotspot.height,
      )
      .reduce<ImageHotspot | null>(
        (best, hotspot) => (best === null || hotspot.priority > best.priority ? hotspot : best),
        null,
      );
    return winner === null ? null : copy(winner);
  };
  return {
    width: imageWidth,
    height: imageHeight,
    listHotspots: () => hotspots.map(copy),
    hitTest: at,
    activateAt(x, y) {
      const hotspot = at(x, y);
      return hotspot === null ? null : { hotspot, action: { ...hotspot.action } };
    },
  };
}
