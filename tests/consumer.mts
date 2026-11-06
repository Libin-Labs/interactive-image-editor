import {
  createInteractiveImageEditor,
  type ImageHotspotInput,
} from '@lp-labs/interactive-image-editor';

const hotspots: ImageHotspotInput[] = [
  {
    id: 'details',
    label: 'Details',
    description: 'Open details.',
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    action: { type: 'navigate', target: 'details-page' },
  },
];
const image = createInteractiveImageEditor(100, 80, hotspots);
const target: string | null = image.hitTest(1, 1)?.action.target ?? null;
void target;
