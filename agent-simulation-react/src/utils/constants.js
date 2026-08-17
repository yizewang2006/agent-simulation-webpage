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

export const MEASUREMENT_TYPES = {
  DISTANCE: 0,
  SPEED: 1,
  SPEED_DIFFERENCE: 2,
  HEADING_DIFFERENCE: 3,
  HEADING: 4,
  RELATIVE_BEARING: 5,
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
  SELF_REFERENCE: 1,
};

// Human-readable labels for the UI
export const PROPERTY_LABELS = {
  [TARGET_PROPERTIES.POSITION]: 'Position', // Definition: Bearing
  [TARGET_PROPERTIES.SPEED]: 'Speed',
  [TARGET_PROPERTIES.ANGLE]: 'Angle',
};

export const MEASUREMENT_LABELS = {
  [MEASUREMENT_TYPES.DISTANCE]: 'Distance',
  [MEASUREMENT_TYPES.SPEED]: 'Speed',
  [MEASUREMENT_TYPES.HEADING_DIFFERENCE]: 'Heading Difference',
  [MEASUREMENT_TYPES.HEADING]: 'Heading Angle',
  [MEASUREMENT_TYPES.RELATIVE_BEARING]: 'Relative Bearing',
  [MEASUREMENT_TYPES.SPEED_DIFFERENCE]: 'Speed Difference',
};

// Value to Check options allowed for each Activation source.
export const ACTIVATION_MEASUREMENT_OPTIONS = Object.freeze({
  self: [
    [MEASUREMENT_TYPES.SPEED, 'Self’s Speed'],
    [MEASUREMENT_TYPES.HEADING, 'Self’s Heading Angle'],
  ],
  neighbor: [
    [MEASUREMENT_TYPES.DISTANCE, 'Distance'],
    [MEASUREMENT_TYPES.HEADING, 'Neighbor’s Heading Angle'],
    [MEASUREMENT_TYPES.HEADING_DIFFERENCE, 'Heading Difference'],
    [MEASUREMENT_TYPES.RELATIVE_BEARING, 'Relative Bearing'],
    [MEASUREMENT_TYPES.SPEED, 'Neighbor’s Speed'],
    [MEASUREMENT_TYPES.SPEED_DIFFERENCE, 'Speed Difference'],
  ],
});

export const ENTITY_LABELS = {
  [ENTITY_TYPES.AGENT]: 'Agent',
  [ENTITY_TYPES.OBSTACLE]: 'Obstacle',
  [ENTITY_TYPES.LEADER]: 'Leader',
  [ENTITY_TYPES.EXIT]: 'Exit/Escape Point',
};

// Tabs shown in the third-generation Simulation Explorer.
export const EXPLORER_TABS = Object.freeze({
  ENTITIES: 'entities',
  BEHAVIORS: 'behaviors',
  RECORDINGS: 'recordings',
  HISTORY: 'history',
});

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
  [MEASUREMENT_TYPES.DISTANCE]: {
    [METHOD_TYPES.CLOSEST]: 'Closest',
    [METHOD_TYPES.FARTHEST]: 'Farthest',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [MEASUREMENT_TYPES.SPEED]: {
    [METHOD_TYPES.CLOSEST]: 'Slowest',
    [METHOD_TYPES.FARTHEST]: 'Fastest',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [MEASUREMENT_TYPES.HEADING_DIFFERENCE]: {
    [METHOD_TYPES.CLOSEST]: 'Smallest Heading Difference',
    [METHOD_TYPES.FARTHEST]: 'Largest Heading Difference',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [MEASUREMENT_TYPES.HEADING]: {
    [METHOD_TYPES.CLOSEST]: 'Lowest Heading',
    [METHOD_TYPES.FARTHEST]: 'Highest Heading',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [MEASUREMENT_TYPES.RELATIVE_BEARING]: {
    [METHOD_TYPES.CLOSEST]: 'Smallest Relative Bearing',
    [METHOD_TYPES.FARTHEST]: 'Largest Relative Bearing',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
  [MEASUREMENT_TYPES.SPEED_DIFFERENCE]: {
    [METHOD_TYPES.CLOSEST]: 'Smallest Speed Difference',
    [METHOD_TYPES.FARTHEST]: 'Largest Speed Difference',
    [METHOD_TYPES.AVERAGE]: 'Average',
  },
};

export const REFERENCE_LABELS = {
  [REFERENCE_TYPES.NEIGHBOR_REFERENCE]: 'Neighbor Reference',
  [REFERENCE_TYPES.SELF_REFERENCE]: 'Self-Reference',
};

// Short simulation-themed messages shown at random during route transitions.
export const LOADING_MESSAGES = [
  'Following...',
  'Behaving...',
  'Evacuating...',
  'Navigating...',
  'Avoiding obstacles...',
  'Finding the exit...',
  'Forming a crowd...',
  'Flocking...',
  'Forming a snake-like pattern...',
  'Finding the nearest neighbor...',
  'Finding the farthest neighbor...',
  'Calculating average neighbor properties...',
  'Calculating relative bearings...',
  'Calculating heading differences...',
  'Calculating self-reference properties...',
  'Calculating neighbor reference properties...',
  'Calculating distances to neighbors...',
  'Calculating speeds of neighbors...',
  'Calculating angles of neighbors...',
  'Calculating positions of neighbors...',
  'Calculating positions of obstacles...',
  'Calculating positions of exits...',
  'Calculating positions of leaders...',
  'Calculating positions of agents...',
  'Calculating positions of entities...',
  'Simulating...',
];
