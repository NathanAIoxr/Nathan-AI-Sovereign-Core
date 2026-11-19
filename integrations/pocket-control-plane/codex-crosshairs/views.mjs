const directions = [
  { id: 'forward', label: 'Forward', x: 1, y: 1, turn: 0 },
  { id: 'backward', label: 'Backward', x: -1, y: 1, turn: 0 },
  { id: 'upside-down', label: 'Upside down', x: -1, y: -1, turn: 180 },
];

const mirrorPositions = [
  { id: 'this-side', label: 'This side of the mirror', x: 1 },
  { id: 'as-mirror', label: 'As the mirror', x: 1 },
  { id: 'other-side', label: 'Other side of the mirror', x: -1 },
];

export const anchors = [
  { id: 'mother-earth', label: 'X at the core of Mother Earth', origin: [0, 0, 0], frame: 'symbolic earth-centered origin' },
  { id: 'human-mind', label: 'X in every human mind', origin: [0, 0], frame: 'symbolic point of view' },
];

export function createViews(entries) {
  return directions.flatMap(direction => mirrorPositions.map(mirror => {
    const xScale = direction.x * mirror.x;
    const positions = entries.map((entry, ordinal) => {
      const x = (2 * ordinal - (entries.length - 1)) * xScale;
      const position = [x || 0, direction.y];
      return {
        id: entry.id,
        position,
        ...(mirror.id === 'as-mirror' ? { counterpart: [-x || 0, direction.y] } : {}),
      };
    }).sort((first, second) => first.position[0] - second.position[0]);

    return {
      id: direction.id + ':' + mirror.id,
      direction: direction.id,
      directionLabel: direction.label,
      mirror: mirror.id,
      mirrorLabel: mirror.label,
      rotation: direction.turn,
      flipGlyphs: mirror.id === 'other-side',
      positions,
    };
  }));
}
