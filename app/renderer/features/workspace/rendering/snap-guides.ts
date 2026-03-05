import type { GuideLine } from './scene-types';

export interface SnapBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AxisSnap {
  delta: number;
  line: GuideLine | null;
}

const SNAP_THRESHOLD = 8;

function edgePoints(box: SnapBox) {
  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;
  return {
    x: [box.x, centerX, box.x + box.width],
    y: [box.y, centerY, box.y + box.height],
  };
}

function bestAxisDelta(current: number[], targets: number[], makeLine: (value: number) => GuideLine): AxisSnap {
  let bestDelta = 0;
  let bestAbsDelta = SNAP_THRESHOLD + 1;
  let bestLine: GuideLine | null = null;

  for (const source of current) {
    for (const target of targets) {
      const delta = target - source;
      const absDelta = Math.abs(delta);
      if (absDelta < bestAbsDelta && absDelta <= SNAP_THRESHOLD) {
        bestDelta = delta;
        bestAbsDelta = absDelta;
        bestLine = makeLine(target);
      }
    }
  }

  return { delta: bestDelta, line: bestLine };
}

export function resolveSnap(box: SnapBox, others: SnapBox[], stageWidth: number, stageHeight: number): { x: number; y: number; guides: GuideLine[] } {
  const current = edgePoints(box);
  const targetX: number[] = [0, stageWidth / 2, stageWidth];
  const targetY: number[] = [0, stageHeight / 2, stageHeight];

  for (const candidate of others) {
    const points = edgePoints(candidate);
    targetX.push(...points.x);
    targetY.push(...points.y);
  }

  const xSnap = bestAxisDelta(current.x, targetX, (value) => ({ points: [value, 0, value, stageHeight], orientation: 'vertical' }));
  const ySnap = bestAxisDelta(current.y, targetY, (value) => ({ points: [0, value, stageWidth, value], orientation: 'horizontal' }));

  const guides: GuideLine[] = [];
  if (xSnap.line) guides.push(xSnap.line);
  if (ySnap.line) guides.push(ySnap.line);

  return { x: box.x + xSnap.delta, y: box.y + ySnap.delta, guides };
}
