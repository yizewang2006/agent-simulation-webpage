import {
  ENTITY_TYPES,
  MEASUREMENT_TYPES,
  METHOD_TYPES,
  OBSTACLE_SHAPE_TYPES,
  TARGET_PROPERTIES,
} from "../utils/constants.js";
import { getCanvasLogicalHeight, getCanvasLogicalWidth } from "../utils/utilities.js";

export {
  ENTITY_LABELS,
  ENTITY_TYPES,
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  METHOD_LABELS,
  METHOD_LABELS_BY_PROPERTY,
  METHOD_TYPES,
  OBSTACLE_SHAPE_LABELS,
  OBSTACLE_SHAPE_TYPES,
  PROPERTY_LABELS,
  REFERENCE_LABELS,
  REFERENCE_TYPES,
  TARGET_PROPERTIES,
} from "../utils/constants.js";

// ─── Behavior class (currently unused; runtime uses plain objects) ───────────
// export class Behavior {
//   constructor(name, targetProperty) {
//     this.name = name;
//     this.targetProperty = targetProperty;
//     this.filters = [];
//   }
//
//   addFilter(filter) {
//     this.filters.push(filter);
//   }
//
//   removeFilter(index) {
//     this.filters.splice(index, 1);
//   }
//
//   apply(targetAgents) {
//   }
// }

// Parent class of all Filters
export class Filter {
  constructor(targetProperty, filterType, parameters) {
    this.targetProperty = targetProperty; // PROPERTY_TYPE.*
    this.filterType = filterType; // ranged, method
    this.parameters = parameters; // i.e. low/high for ranged, methodType for method
  }

  apply(self, agents) {
    return agents; // OVERRIDES by subclasses
  }
}

// RANGED FILTER
export class RangedFilter extends Filter {
  constructor(propertyType, low, high) {
    super();
    this.propertyType = propertyType;
    this.low = parseRangeBound(low, 0);
    this.high = parseRangeBound(high, getDefaultRangeHigh(propertyType));
  }

  apply(self, entities) {
    return entities.filter(entity => {
      const value = getEntityMeasurementValue(this.propertyType, self, entity);
      if (value === null) return false;

      if (isAngleMeasurement(this.propertyType)) {
        return isAngleInRange(value, this.low, this.high);
      }

      return value >= this.low && value <= this.high;
    });
  }
}

// METHOD FILTER
export class MethodFilter extends Filter {
  constructor(propertyType, methodType) {
    super();
    this.propertyType = propertyType;
    this.methodType = methodType;
  }

  apply(self, entities) {
    const supportedEntities = entities
      .map(entity => ({
        entity,
        value: getEntityMeasurementValue(this.propertyType, self, entity),
      }))
      .filter(({ value }) => value !== null);

    if (supportedEntities.length === 0) return [];

    // AVERAGE: pass all supported entities through; applyBehavior computes the average across them.
    if (this.methodType === METHOD_TYPES.AVERAGE) {
      return supportedEntities.map(({ entity }) => entity);
    }

    let best = supportedEntities[0];
    for (const candidate of supportedEntities) {
      if (this.methodType === METHOD_TYPES.CLOSEST && candidate.value < best.value) best = candidate;
      if (this.methodType === METHOD_TYPES.FARTHEST && candidate.value > best.value) best = candidate;
    }
    return [best.entity];
  }
}

// ─── Entity value readers ────────────────────────────────────────────────────
// These functions read geometry, Filter values, or Action values from Entities.

function getEntitySpeed(entity) {
  const dx = entity.behaviorDx ?? entity.dx;
  const dy = entity.behaviorDy ?? entity.dy;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

function getEntityHeading(entity) {
  return entity.behaviorAngle ?? entity.angle;
}

// Returns the offset from one position to another, accounting for warping.
export function getShortestOffset(fromPosition, toPosition, canvas) {
  let diffX = toPosition.x - fromPosition.x;
  let diffY = toPosition.y - fromPosition.y;

  if (!canvas) return { diffX, diffY };

  const canvasWidth = getCanvasLogicalWidth(canvas);
  const canvasHeight = getCanvasLogicalHeight(canvas);
  if (canvasWidth <= 0 || canvasHeight <= 0) return { diffX, diffY };

  while (diffX > canvasWidth / 2) diffX -= canvasWidth;
  while (diffX < -canvasWidth / 2) diffX += canvasWidth;
  while (diffY > canvasHeight / 2) diffY -= canvasHeight;
  while (diffY < -canvasHeight / 2) diffY += canvasHeight;

  return { diffX, diffY };
}

export function getHeadingDifferenceDeg(self, neighbor) {
  const selfHeading = (getEntityHeading(self) * 180 / Math.PI + 360) % 360;
  const neighborHeading = (getEntityHeading(neighbor) * 180 / Math.PI + 360) % 360;
  return (neighborHeading - selfHeading + 360) % 360;
}

export function getEntityCenterPoint(entity) {
  if (!entity) return null;
  if (entity.entityType === ENTITY_TYPES.AGENT) return entity;
  if (entity.entityType !== ENTITY_TYPES.OBSTACLE) return null;
  if (entity.shapeType === OBSTACLE_SHAPE_TYPES.CIRCLE) return entity.center;
  if (entity.shapeType === OBSTACLE_SHAPE_TYPES.POLYGON) return entity.centroid;
  return null;
}

export function getEntityReferencePosition(self, entity) {
  const centerPoint = getEntityCenterPoint(entity);
  if (!centerPoint) return null;

  if (typeof entity.getClosestPointTo === 'function') {
    // Obstacles use the closest boundary point, not the center/centroid, for detection and steering.
    return entity.getClosestPointTo(getObstacleQueryPosition(self, entity));
  }

  return centerPoint;
}

export function getEntityDetectionPoints(self, entity) {
  if (!getEntityCenterPoint(entity)) return [];

  if (typeof entity.getDetectionPointsTo === 'function') { // FOR POLYGON OBSTACLES, THEY HAVE A FUNCTION called getDetectionPointsTo that returns detection points
    // Obstacles use the closest boundary point for detection and steering.
    return entity.getDetectionPointsTo(getObstacleQueryPosition(self, entity));
  }

  const refPos = getEntityReferencePosition(self, entity);
  return refPos ? [refPos] : [];
}

function getObstacleQueryPosition(self, entity) {
  const obstacleCenter = getEntityCenterPoint(entity);

  const { diffX, diffY } = getShortestOffset(obstacleCenter, self, self.canvas);
  return {
    x: obstacleCenter.x + diffX,
    y: obstacleCenter.y + diffY,
  };
}

// Read one Filter Property from one entity.
function getEntityMeasurementValue(measurementType, self, entity) {
  if (!entity) return null;

  switch (measurementType) {
    case MEASUREMENT_TYPES.DISTANCE: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!referencePosition) return null;
      // Distance-based filters should measure to the visible obstacle boundary, not obstacle center.
      const { diffX, diffY } = getShortestOffset(self, referencePosition, self.canvas);
      return Math.sqrt(diffX ** 2 + diffY ** 2);
    }
    case MEASUREMENT_TYPES.HEADING_DIFFERENCE: {
      if (!self?.hasHeading || entity.hasHeading !== true) return null;
      return getHeadingDifferenceDeg(self, entity);
    }
    case MEASUREMENT_TYPES.RELATIVE_BEARING: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!referencePosition) return null;
      // Bearing-based filters should aim at the closest obstacle boundary point.
      const { diffX, diffY } = getShortestOffset(self, referencePosition, self.canvas);
      const bearing = Math.atan2(diffY, diffX) * 180 / Math.PI;
      const selfHeading = (getEntityHeading(self) * 180 / Math.PI + 360) % 360;
      return (bearing - selfHeading + 360) % 360;
    }

    case MEASUREMENT_TYPES.SPEED:
      if (entity.hasMotion !== true) return null;
      return getEntitySpeed(entity);

    case MEASUREMENT_TYPES.HEADING:
      if (entity.hasHeading !== true) return null;
      return (getEntityHeading(entity) * 180 / Math.PI + 360) % 360;

    case MEASUREMENT_TYPES.SPEED_DIFFERENCE:
      if (self?.hasMotion !== true || entity.hasMotion !== true) return null;
      return Math.abs(getEntitySpeed(entity) - getEntitySpeed(self));

    default:
      return null;
  }
}

// Determine whether the entity supports the targetProperty (as opposed to filter properties)
function supportsActionProperty(entity, targetProperty) {
  if (!entity) return false; // check if entity is null or undefined

  switch (targetProperty) {
    case TARGET_PROPERTIES.POSITION:
      return getEntityCenterPoint(entity) !== null;
    case TARGET_PROPERTIES.SPEED:
      return entity.hasMotion === true;
    case TARGET_PROPERTIES.ANGLE:
      return entity.hasHeading === true;
    default:
      return false;
  }
}

// Returns the target value based on the targetProperty
function getEntityActionValue(targetProperty, self, entity) {
  if (!supportsActionProperty(entity, targetProperty)) return null;

  switch (targetProperty) {
    case TARGET_PROPERTIES.POSITION: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!referencePosition) return null;
      // Position targets should steer relative to obstacle edges, not their centers.
      const { diffX, diffY } = getShortestOffset(self, referencePosition, self.canvas);
      return Math.atan2(diffY, diffX);
    }

    case TARGET_PROPERTIES.SPEED:
      return getEntitySpeed(entity);

    case TARGET_PROPERTIES.ANGLE:
      return getEntityHeading(entity);

    default:
      return null;
  }
}

// ─── Entity filtering ────────────────────────────────────────────────────────
// applyEntityFilter selects entities using Entity Targets and one Filter.

// Apply entity targets first, then the selected Ranged or Method algorithm.
function applyEntityFilter(agentFilter, self, entities) {
  const targets = agentFilter?.targets ?? null;
  const targetedEntities = entities.filter((entity) => {
    if (!entity) return false;

    // Legacy filters did not have target scopes. Keep them agent-only by default
    // so old behavior presets do not suddenly react to obstacles.
    if (!targets) return entity.entityType === ENTITY_TYPES.AGENT;

    if (entity.entityType === ENTITY_TYPES.OBSTACLE) {
      const obstacleTargets = targets[ENTITY_TYPES.OBSTACLE];

      if (!obstacleTargets) return false;
      if (!obstacleTargets.enabled) return false;
      if (entity.shapeType === undefined || entity.shapeType === null) return false;
      if (!obstacleTargets[entity.shapeType]) return false;

      return true;
    }

    // More entity-specific conditional statement coming soon

    return Boolean(targets[entity.entityType]);
  });

  // No Filter means the default agent-only target scope.
  if (!agentFilter) return targetedEntities;

  if (agentFilter.filterType === 'ranged')
    return new RangedFilter(agentFilter.propertyType, agentFilter.low, agentFilter.high).apply(self, targetedEntities);
  if (agentFilter.filterType === 'method')
    return new MethodFilter(agentFilter.propertyType, agentFilter.methodType).apply(self, targetedEntities);
  return targetedEntities;
}

function isAngleMeasurement(measurementType) {
  return (
    measurementType === MEASUREMENT_TYPES.HEADING_DIFFERENCE ||
    measurementType === MEASUREMENT_TYPES.HEADING ||
    measurementType === MEASUREMENT_TYPES.RELATIVE_BEARING
  );
}

function parseRangeBound(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Some default high/low values
function getDefaultRangeHigh(propertyType) {
  if (isAngleMeasurement(propertyType)) return 360;
  return Infinity;
}

// ─── Behavior value calculation ──────────────────────────────────────────────
// Apply Behavior Filters, then combine the qualifying Entities' Action values.
// Return a target value depending on the behavior
export function calculateBehaviorValue(behavior, self, detectedEntities) {
    const filters = Array.isArray(behavior.filters) ? behavior.filters : [];
    let detectedEntitiesForBehavior = [...detectedEntities]; // All detected entities before filtering

    if (filters.length === 0) detectedEntitiesForBehavior = applyEntityFilter(null, self, detectedEntitiesForBehavior);
    
    for (const filter of filters) {
      detectedEntitiesForBehavior = applyEntityFilter(filter, self, detectedEntitiesForBehavior);
      if (detectedEntitiesForBehavior.length === 0) {
        // detectedEntities.forEach(entity => entity.colorHex = '#FF0000'); // failed filter but still in FOV — reset to red
        return null;
      }
    }

    if (detectedEntitiesForBehavior.length > 0) {
      // detectedEntitiesForBehavior.forEach(entity => entity.colorHex = "#00FF00"); // ALL filtered entities turn green (red color change in agent.js)

      const targetValues = detectedEntitiesForBehavior
        .map(entity => getEntityActionValue(behavior.targetProperty, self, entity))
        .filter(value => value !== null);

      if (targetValues.length === 0) return null;

      // Behavior value calculation
      switch (behavior.targetProperty) {
        case TARGET_PROPERTIES.POSITION: {
          let sinSum = 0, cosSum = 0;
          for (const value of targetValues) {
            sinSum += Math.sin(value);
            cosSum += Math.cos(value);
          }
          return Math.atan2(sinSum, cosSum);
        }
        case TARGET_PROPERTIES.SPEED: {
          let total = 0;
          for (const value of targetValues) total += value;
          return total / targetValues.length;
        }
        case TARGET_PROPERTIES.ANGLE: {
          let sinSum = 0, cosSum = 0;
          for (const value of targetValues) {
            sinSum += Math.sin(value);
            cosSum += Math.cos(value);
          }
          return Math.atan2(sinSum, cosSum);
        }
      }
    }
    return null;
  }

// ─── Angle helpers ───────────────────────────────────────────────────────────
// 0 - 360 correction
export function isAngleInRange(value, low, high) {
  if (low <= high) return value >= low && value <= high;
  return value >= low || value <= high;
}

// Move partway toward the target using the shortest rotation direction.
export function smoothTowardAngle(currentAngle, targetAngle, smoothingFactor) {
  const shortestDifference = Math.atan2(
    Math.sin(targetAngle - currentAngle),
    Math.cos(targetAngle - currentAngle)
  );

  return currentAngle + shortestDifference * smoothingFactor;
}

// Smoothing Calculator (based on max angle)
export function turnTowardAngle(initial, final, maxAngle) {
  let diff = final - initial;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  return initial + Math.sign(diff) * Math.min(Math.abs(diff), maxAngle);
}

// ─── Activation value calculation ────────────────────────────────────────────
// Filter entities, read their properties, then combine them into one value.
export function getActivationInputValue(activation, self, detectedEntities) {
  // If source = self-property, return the self's property value
  if (activation.checkSource === "self") return getEntityMeasurementValue(activation.valueToCheck, self, self);

  // Otherwise, return null:
  if (activation.checkSource !== "neighbor") return null;

  // If source = neighbor-property, then use detectedEntities as normal
  const filters = Array.isArray(activation.filters) ? activation.filters : [];

  let qualifyingEntities = [...detectedEntities]; // read detectedEntities

  if (filters.length === 0) { // If no filters is used, keep the default Agent-only target scope.
    qualifyingEntities = applyEntityFilter(
      null,
      self,
      qualifyingEntities
    );
  }

  const activationValues = []; // activation value container

  // Apply filters one by one
  for (const filter of filters) {
    qualifyingEntities = applyEntityFilter(
      filter,
      self,
      qualifyingEntities
    );

    if (qualifyingEntities.length === 0) {
      return null;
    }
  }

  // Since we have a list of qualifying entities, extract their values
  for (const entity of qualifyingEntities) {
    const value = getEntityMeasurementValue( // Grab the value, and down below, if the value is finite, push it to activationValues for calculation
      activation.valueToCheck,
      self,
      entity
    );

    if (Number.isFinite(value)) {
      activationValues.push(value);
    }
  }

  // Finally, use activationValues array and calculateAverageActivationValue() to return an average value
  return calculateAverageActivationValue(activation.valueToCheck, activationValues);
}

// Used above, aggregate all qualifying entity and return an average value. Note there is no 'export'
function calculateAverageActivationValue(measurementType, values = []) {
  if (values.length === 0) return null;

  // Total value
  let total = 0;

  // Circular: ANGLUAR variables are circular, should be treated differently
  const isCircular = measurementType === MEASUREMENT_TYPES.HEADING || measurementType === MEASUREMENT_TYPES.RELATIVE_BEARING;

  // Speed, or other numeric non-circular variables, use arithmetic mean
  if (!isCircular) {
    for (const val of values) {
      total += val;
    }
    return total / values.length;
  }

  // Circular values:
  let sinSum = 0;
  let cosSum = 0;

  for (const deg of values) {
    const radian = deg * Math.PI / 180; // convert to radian

    sinSum += Math.sin(radian);
    cosSum += Math.cos(radian);
  }

  const averageRadians = Math.atan2(
    sinSum,
    cosSum
  );

  return (
    averageRadians * 180 / Math.PI + 360
  ) % 360; // return average degree
}
