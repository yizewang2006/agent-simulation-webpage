import {
  ENTITY_TYPES,
  FILTER_TYPES,
  METHOD_TYPES,
  TARGET_PROPERTIES,
} from "../utils/constants.js";
import { getCanvasLogicalHeight, getCanvasLogicalWidth } from "../utils/utilities.js";

export {
  ENTITY_LABELS,
  ENTITY_TYPES,
  FILTER_LABELS,
  FILTER_TYPES,
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

// ─── Property (base) ──────────────────────────────────────────────────────────

class Property {
  // Returns the relevant value from an agent
  get(_agent) {}

  // Compares self's property with a target agent's property
  compare(_self, _target) {}
}

// ─── Speed ────────────────────────────────────────────────────────────────────

export class Speed extends Property {
  // TODO
  get(_agent) {}
  compare(_self, _target) {}
}

// ─── Position ─────────────────────────────────────────────────────────────────

export class Position extends Property {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }

  add(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  get(_agent) {
    return _agent.position;
  }

  findAverage(self, targets) {
    let avgX = 0, avgY = 0;
    for (const target of targets) {
      avgX += target.position.x;
      avgY += target.position.y;
    }
    avgX /= targets.length;
    avgY /= targets.length;
    return new Position(avgX, avgY);
  }

  findNthClosest(_self, targets, n) {
    if (!targets || targets.length === 0) {
      console.log("There are no agents available for detection");
      return null;
    }
    if (n < 1 || n > targets.length) {
      console.log("Invalid n");
      return null;
    }
    return this.quickSelect([...targets], n - 1, self);
  }

  quickSelect(targets, n, self) {
    if (targets.length === 1) return targets[0];
    const pivot = targets[Math.floor(Math.random() * targets.length)];
    const pivotDist = self.position.distanceTo(pivot.position);
    const left = [], equal = [], right = [];
    for (const agent of targets) {
      const d = self.position.distanceTo(agent.position);
      if (d < pivotDist)      left.push(agent);
      else if (d > pivotDist) right.push(agent);
      else                    equal.push(agent);
    }
    if (n < left.length)
      return this.quickSelect(left, n, self);
    else if (n < left.length + equal.length)
      return pivot;
    else
      return this.quickSelect(right, n - left.length - equal.length, self);
  }

  distanceTo(position) {
    let diffX = Math.abs(this.x - position.x);
    let diffY = Math.abs(this.y - position.y);
    return Math.sqrt(diffX * diffX + diffY * diffY);
  }

  compare(self, target) {
    return this.distanceTo(target.position);
  }
}

// ─── Angle ────────────────────────────────────────────────────────────────────

export class Angle extends Property {
  // TODO
  get(_agent) {}
  compare(_self, _target) {}
}

// // New Code start from here. June 2 2026
/* 
  Behaviors should have a name, targetProperty, and filters.
  Filters class (can be added to behaviors) should have a targetProperty and parameters specific to the filter type (e.g., low/high for RangedFilter, methodType for MethodFilter).
*/

/* This behavior class is NOT IN USE. We use plain javascript objects in Simulation.jsx */
export class Behavior {
  constructor(name, targetProperty) {
    this.name = name;
    this.targetProperty = targetProperty; // PROPERTY_TYPE.*
    this.filters = []; // list of Filter instances (inside that particular behavior.)
  }

  // Will push new filter to the filters list.
  addFilter(filter) {
    this.filters.push(filter);
  }

  // Will remove the filter at the specified index from the filters list.
  removeFilter(index) {
    this.filters.splice(index, 1);
  }

  apply(targetAgents){ // defines who this behavior is being applied to.

  }
}

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
      const value = getFilterValue(this.propertyType, self, entity);
      if (value === null) return false;

      if (isAngleFilterProperty(this.propertyType)) {
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
        value: getFilterValue(this.propertyType, self, entity),
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

export function getEntityReferencePosition(self, entity) {
  if (!entity?.position) return null; // if position is null or undefined, or not available for this entity type, return null

  if (typeof entity.getClosestPointTo === 'function') {
    // Obstacles use the closest boundary point, not the center/centroid, for detection and steering.
    return entity.getClosestPointTo(getWrappedQueryPosition(self, entity));
  }

  return entity.position; // otherwise, return the entity's position directly
}

export function getEntityDetectionPoints(self, entity) {
  if (!entity?.position) return [];

  if (typeof entity.getDetectionPointsTo === 'function') { // FOR POLYGON OBSTACLES, THEY HAVE A FUNCTION called getDetectionPointsTo that returns detection points
    // Obstacles use the closest boundary point for detection and steering.
    return entity.getDetectionPointsTo(getWrappedQueryPosition(self, entity));
  }

  const refPos = getEntityReferencePosition(self, entity);
  return refPos ? [refPos] : [];
}

function getWrappedQueryPosition(self, entity) {
  if (!self?.position || !entity?.position) return self?.position;

  const { diffX, diffY } = getWrappedOffset(entity.position, self.position, self.canvas);
  return {
    x: entity.position.x + diffX,
    y: entity.position.y + diffY,
  };
}

// ─── Filter helpers ──────────────────────────────────────────────────────────

// Determines whether this entity supports the filtered property
function supportsProperty(entity, filterPropertyType) {
  if (!entity) return false;
  // check if property is available for selected entity
  switch (filterPropertyType) {
    case (FILTER_TYPES.DISTANCE): return Boolean(entity.position);
    case (FILTER_TYPES.SPEED): return entity.hasMotion === true;
    case (FILTER_TYPES.HEADING_DIFFERENCE):
    case (FILTER_TYPES.HEADING_RAW): return entity.hasHeading === true;
    case (FILTER_TYPES.RELATIVE_BEARING): return Boolean(entity.position);

    default: return false;
  }
}

// Does all calculation for for filter value
function getFilterValue(filterPropertyType, self, entity) {
  if (!supportsProperty(entity, filterPropertyType)) return null;

  switch (filterPropertyType) {
    case FILTER_TYPES.DISTANCE: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!self?.position || !referencePosition) return null;
      // Distance-based filters should measure to the visible obstacle boundary, not obstacle center.
      const { diffX, diffY } = getWrappedOffset(self.position, referencePosition, self.canvas);
      return Math.sqrt(diffX ** 2 + diffY ** 2);
    }
    case FILTER_TYPES.HEADING_DIFFERENCE: {
      if (!self?.hasHeading) return null;
      return getHeadingDifferenceDeg(self, entity);
    }
    case FILTER_TYPES.RELATIVE_BEARING: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!self?.position || !referencePosition) return null;
      // Bearing-based filters should aim at the closest obstacle boundary point.
      const { diffX, diffY } = getWrappedOffset(self.position, referencePosition, self.canvas);
      const bearing = Math.atan2(diffY, diffX) * 180 / Math.PI;
      const selfHeading = (getEntityHeading(self) * 180 / Math.PI + 360) % 360;
      return (bearing - selfHeading + 360) % 360;
    }

    case FILTER_TYPES.SPEED:
      return getEntitySpeed(entity);

    case FILTER_TYPES.HEADING_RAW:
      return (getEntityHeading(entity) * 180 / Math.PI + 360) % 360;

    default:
      return null;
  }
}

function getEntitySpeed(entity) {
  const dx = entity.behaviorDx ?? entity.dx;
  const dy = entity.behaviorDy ?? entity.dy;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

function getEntityHeading(entity) {
  return entity.behaviorAngle ?? entity.angle;
}

// Based on UI choices, filter ENTITY TYPES!
function filterByTargets(entities, targets) {
  return entities.filter((entity) => {
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
}

// Returns a list of entities — delegates to RangedFilter or MethodFilter class
function applyFilters(agentFilter, self, entities) {
  if (agentFilter.filterType === 'ranged')
    return new RangedFilter(agentFilter.propertyType, agentFilter.low, agentFilter.high).apply(self, entities);
  if (agentFilter.filterType === 'method')
    return new MethodFilter(agentFilter.propertyType, agentFilter.methodType).apply(self, entities);
  return entities; // fallback
}

function isAngleFilterProperty(propertyType) {
  return (
    propertyType === FILTER_TYPES.HEADING_DIFFERENCE ||
    propertyType === FILTER_TYPES.HEADING_RAW ||
    propertyType === FILTER_TYPES.RELATIVE_BEARING
  );
}

function parseRangeBound(value, fallback) {
  if (value === '' || value === null || value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// Some default high/low values
function getDefaultRangeHigh(propertyType) {
  if (isAngleFilterProperty(propertyType)) return 360;
  return Infinity;
}

// ─── Target property helpers ─────────────────────────────────────────────────

// Determine whether the entity supports the targetProperty (as opposed to filter properties)
function supportsTargetProperty(entity, targetProperty) {
  if (!entity) return false; // check if entity is null or undefined

  switch (targetProperty) {
    case TARGET_PROPERTIES.POSITION:
      return Boolean(entity.position);
    case TARGET_PROPERTIES.SPEED:
      return entity.hasMotion === true;
    case TARGET_PROPERTIES.ANGLE:
      return entity.hasHeading === true;
    default:
      return false;
  }
}

// Returns the target value based on the targetProperty
function getTargetValue(targetProperty, self, entity) {
  if (!supportsTargetProperty(entity, targetProperty)) return null;

  switch (targetProperty) {
    case TARGET_PROPERTIES.POSITION: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!self?.position || !referencePosition) return null;
      // Position targets should steer relative to obstacle edges, not their centers.
      const { diffX, diffY } = getWrappedOffset(self.position, referencePosition, self.canvas);
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

// Return a target value depending on the behavior
export function getBehaviorTarget(behavior, self, detectedEntities) {
    const filters = Array.isArray(behavior.filters) ? behavior.filters : [];
    let detectedEntitiesForBehavior = [...detectedEntities]; // All detected entities before filtering

    if (filters.length === 0) detectedEntitiesForBehavior = filterByTargets(detectedEntitiesForBehavior, null);
    
    for (const filter of filters) {
      detectedEntitiesForBehavior = filterByTargets(detectedEntitiesForBehavior, filter.targets);
      detectedEntitiesForBehavior = applyFilters(filter, self, detectedEntitiesForBehavior);
      if (detectedEntitiesForBehavior.length === 0) {
        // detectedEntities.forEach(entity => entity.colorHex = '#FF0000'); // failed filter but still in FOV — reset to red
        return null;
      }
    }

    if (detectedEntitiesForBehavior.length > 0) {
      // detectedEntitiesForBehavior.forEach(entity => entity.colorHex = "#00FF00"); // ALL filtered entities turn green (red color change in agent.js)

      const targetValues = detectedEntitiesForBehavior
        .map(entity => getTargetValue(behavior.targetProperty, self, entity))
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

// Will correct the offset to account for warping
export function offsetCorrection(diffX, diffY, canvas) {
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

// Returns the offset from one position to another, accounting for warping
export function getWrappedOffset(fromPosition, toPosition, canvas) {
  return offsetCorrection(
    toPosition.x - fromPosition.x,
    toPosition.y - fromPosition.y,
    canvas
  );
}

// Returns the offset from one position to another, accounting for warping
export function getHeadingDifferenceDeg(self, neighbor) {
  const selfHeading = (getEntityHeading(self) * 180 / Math.PI + 360) % 360;
  const neighborHeading = (getEntityHeading(neighbor) * 180 / Math.PI + 360) % 360;
  return (neighborHeading - selfHeading + 360) % 360;
}

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
