// ─── Constants (numeric identifiers used in computation & UI) ────────────────

export const TARGET_PROPERTIES = {
  POSITION: 0,
  SPEED: 1,
  ANGLE: 2,
};

export const METHOD_TYPES = {
  CLOSEST: 0,
  AVERAGE: 1,
  FARTHEST: 2,
};

export const FILTER_TYPES = {
  DISTANCE: 0,
  SPEED: 1,
  HEADING_DIFFERENCE: 2, // Heading difference
  HEADING_RAW: 3, // Raw Heading
  RELATIVE_BEARING: 4, // Target position relative to self heading
};

export const ENTITY_TYPES = {
  AGENT: 0,
  OBSTACLE: 1,
  LEADER: 2,
  EXIT: 3,
};

export const OBSTACLE_SHAPE_TYPES = {
  CIRCLE: 0,
  POLYGON: 1,
};

export const REFERENCE_TYPES = {
  NEIGHBOR_REFERENCE: 0,
  SELF_SPACE: 1,
};

// Human-readable labels for the UI
export const PROPERTY_LABELS = {
  [TARGET_PROPERTIES.POSITION]: 'Position', // Definition: Bearing
  [TARGET_PROPERTIES.SPEED]: 'Speed',
  [TARGET_PROPERTIES.ANGLE]: 'Angle',
};

export const FILTER_LABELS = {
  [FILTER_TYPES.DISTANCE]: 'Distance',
  [FILTER_TYPES.SPEED]: 'Speed',
  [FILTER_TYPES.HEADING_DIFFERENCE]: 'Heading Difference (0-360)',
  [FILTER_TYPES.HEADING_RAW]: 'Raw Heading',
  [FILTER_TYPES.RELATIVE_BEARING]: 'Relative Bearing (0-360)',
};

export const ENTITY_LABELS = {
  [ENTITY_TYPES.AGENT]: 'Agent',
  [ENTITY_TYPES.OBSTACLE]: 'Obstacle',
  [ENTITY_TYPES.LEADER]: 'Leader',
  [ENTITY_TYPES.EXIT]: 'Exit/Escape Point',
};

export const OBSTACLE_SHAPE_LABELS = {
  [OBSTACLE_SHAPE_TYPES.CIRCLE]: 'Circle',
  [OBSTACLE_SHAPE_TYPES.POLYGON]: 'Polygon',
};

export const METHOD_LABELS = {
  [METHOD_TYPES.CLOSEST]: 'Closest',
  [METHOD_TYPES.FARTHEST]: 'Farthest',
  [METHOD_TYPES.AVERAGE]: 'Average',
};

export const METHOD_LABELS_BY_PROPERTY = {
  [FILTER_TYPES.DISTANCE]: {
    [METHOD_TYPES.CLOSEST]: 'Closest',
    [METHOD_TYPES.FARTHEST]: 'Farthest',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [FILTER_TYPES.SPEED]: {
    [METHOD_TYPES.CLOSEST]: 'Slowest',
    [METHOD_TYPES.FARTHEST]: 'Fastest',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [FILTER_TYPES.HEADING_DIFFERENCE]: {
    [METHOD_TYPES.CLOSEST]: 'Smallest Heading Difference',
    [METHOD_TYPES.FARTHEST]: 'Largest Heading Difference',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [FILTER_TYPES.HEADING_RAW]: {
    [METHOD_TYPES.CLOSEST]: 'Lowest Heading',
    [METHOD_TYPES.FARTHEST]: 'Highest Heading',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [FILTER_TYPES.RELATIVE_BEARING]: {
    [METHOD_TYPES.CLOSEST]: 'Smallest Relative Bearing',
    [METHOD_TYPES.FARTHEST]: 'Largest Relative Bearing',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
};

export const REFERENCE_LABELS = {
  [REFERENCE_TYPES.NEIGHBOR_REFERENCE]: 'Neighbor Reference',
  [REFERENCE_TYPES.SELF_SPACE]: 'Self-Space',
};
