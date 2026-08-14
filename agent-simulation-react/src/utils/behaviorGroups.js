import { TARGET_PROPERTIES } from './constants.js';

// This file essentially serves as a behavior groups.

export const BEHAVIOR_GROUPS = Object.freeze({
  HEADING_DIRECTION: 'headingDirection',
  SPEED: 'speed',
});

export const BEHAVIOR_GROUP_DEFINITIONS = Object.freeze([
  { key: BEHAVIOR_GROUPS.HEADING_DIRECTION, label: 'Heading Direction Behaviors' },
  { key: BEHAVIOR_GROUPS.SPEED, label: 'Speed Behaviors' },
]);

// Position and Angle both control the Agent's heading direction.
// Maps position and angle to the same group.
export function getBehaviorGroupKey(targetProperty) {
  if (
    targetProperty === TARGET_PROPERTIES.POSITION ||
    targetProperty === TARGET_PROPERTIES.ANGLE
  ) {
    return BEHAVIOR_GROUPS.HEADING_DIRECTION;
  }

  if (targetProperty === TARGET_PROPERTIES.SPEED) {
    return BEHAVIOR_GROUPS.SPEED;
  }

  return null;
}

export function groupBehaviors(behaviors, enabledOnly = false) {
  const groups = {
    [BEHAVIOR_GROUPS.HEADING_DIRECTION]: [],
    [BEHAVIOR_GROUPS.SPEED]: [],
  };

  // If a behavior is disabled, it's not included in the group.
  behaviors.forEach((behavior) => {
    if (enabledOnly && behavior.enabled !== true) return;

    const groupKey = getBehaviorGroupKey(behavior.targetProperty); // <-- get the group key (mapped above)
    if (groupKey) groups[groupKey].push(behavior); // <-- add the behavior to the appropriate group
  });

  return groups;
}