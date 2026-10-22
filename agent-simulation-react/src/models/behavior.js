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

export const ACTIVATION_TYPES = Object.freeze({
  BINARY: "binary",
  LINEAR: "linear",
  ALWAYS_ACTIVE: "always-active",
});

export const DEFAULT_BEHAVIOR_COLOR = "#4f86d7";

const BEHAVIOR_COLOR_PALETTE = [
  "#4f86d7",
  "#e32636",
  "#2ca25f",
  "#8b5cf6",
  "#e58b00",
  "#0891b2",
];
let nextBehaviorColorIndex = 0;

export function getNextBehaviorColor() {
  const color = BEHAVIOR_COLOR_PALETTE[nextBehaviorColorIndex];
  nextBehaviorColorIndex = (nextBehaviorColorIndex + 1) % BEHAVIOR_COLOR_PALETTE.length;
  return color;
}

// Every Behavior starts usable. Beginners can safely skip Activation setup.
export function createDefaultActivation(overrides = {}) {
  return {
    type: ACTIVATION_TYPES.ALWAYS_ACTIVE,
    valueToCheck: MEASUREMENT_TYPES.DISTANCE,
    checkSource: "neighbor",
    lowerRange: "0",
    upperRange: "1",
    weight: "1",
    inside: true,
    slope: "1",
    increase: true,
    nullActivation: false,
    fallbackWeight: "0",
    filters: [],
    ...overrides,
  };
}

// Forms use strings so empty number inputs remain editable.
export function createActivationDraft(savedActivation) {
  const activation = createDefaultActivation(savedActivation);
  return {
    ...activation,
    lowerRange: String(activation.lowerRange),
    upperRange: String(activation.upperRange),
    weight: String(activation.weight),
    slope: String(activation.slope),
    fallbackWeight: String(activation.fallbackWeight),
    filters: activation.filters.map((filter) => ({ ...filter })),
  };
}

// Convert one UI draft into the single Activation saved on a Behavior.
export function normalizeActivationDraft(draft) {
  const type = draft?.type;
  if (!Object.values(ACTIVATION_TYPES).includes(type)) {
    throw new Error("Choose a valid Activation Function.");
  }

  if (type === ACTIVATION_TYPES.ALWAYS_ACTIVE) {
    const weight = Number(draft.weight);
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error("Always Active Weight must be zero or greater.");
    }
    return { type, weight };
  }

  const lowerRange = Number(draft.lowerRange);
  const upperRange = Number(draft.upperRange);
  const valueToCheck = Number(draft.valueToCheck);
  if (!Number.isFinite(lowerRange) || !Number.isFinite(upperRange)) {
    throw new Error("Activation Lower and Upper Range must be valid numbers.");
  }
  if (!Object.values(MEASUREMENT_TYPES).includes(valueToCheck)) {
    throw new Error("Choose a valid Value to Check.");
  }
  if (
    valueToCheck === MEASUREMENT_TYPES.HEADING
    && (lowerRange < 0 || lowerRange > 360 || upperRange < 0 || upperRange > 360)
  ) {
    throw new Error("Heading Activation Range must be between 0° and 360°.");
  }
  if (
    (
      valueToCheck === MEASUREMENT_TYPES.HEADING_DIFFERENCE
      || valueToCheck === MEASUREMENT_TYPES.ANGLE_TO_ENTITY
    )
    && (lowerRange < 0 || lowerRange > 180 || upperRange < 0 || upperRange > 180)
  ) {
    throw new Error("Activation angle range must be between 0° and 180°.");
  }
  if (lowerRange > upperRange) {
    throw new Error("Activation Lower Range cannot exceed Upper Range.");
  }

  const common = {
    type,
    valueToCheck,
    checkSource: draft.checkSource,
    lowerRange,
    upperRange,
    nullActivation: Boolean(draft.nullActivation),
    filters: normalizeFilterDrafts(draft.filters, "Activation Filter"),
  };

  if (common.nullActivation) {
    const fallbackWeight = Number(draft.fallbackWeight);
    if (!Number.isFinite(fallbackWeight) || fallbackWeight < 0) {
      throw new Error("No-Entity Weight must be zero or greater.");
    }
    common.fallbackWeight = fallbackWeight;
  }

  if (!["self", "neighbor"].includes(common.checkSource)) {
    throw new Error("Choose Self or Neighbor Property.");
  }

  if (type === ACTIVATION_TYPES.BINARY) {
    const weight = Number(draft.weight);
    if (!Number.isFinite(weight) || weight < 0) {
      throw new Error("Binary Weight must be zero or greater.");
    }
    return { ...common, weight, inside: Boolean(draft.inside) };
  }

  const slope = Number(draft.slope);
  if (!Number.isFinite(slope) || slope < 0) {
    throw new Error("Linear Slope must be zero or greater.");
  }
  return { ...common, slope, increase: Boolean(draft.increase) };
}

// Weight calculation
export function calculateActivationWeight(activation, activationValue) { // activationValue is the extracted property value Pa
    let weight = 0;

    // 1. Always Active: directly return weight
    if (activation.type === ACTIVATION_TYPES.ALWAYS_ACTIVE) { return activation.weight; }

    // Binary and Linear require a valid activation value.
    if (
        activationValue === null ||
        activationValue === undefined ||
        !Number.isFinite(activationValue)
    ) {
        return activation.nullActivation
            ? activation.fallbackWeight
            : weight;
    }

    // 2. Binary
    if (activation.type === ACTIVATION_TYPES.BINARY) {
        const isInsideRange =
            activationValue >= activation.lowerRange &&
            activationValue <= activation.upperRange;

        const qualifies = activation.inside
            ? isInsideRange
            : !isInsideRange;

        return qualifies ? activation.weight : 0; // If value qualifies for activation, return weight, otherwise return 0
    }

    // 3. Linear
    if (activation.type === ACTIVATION_TYPES.LINEAR) {
        if (activation.increase) { // <-- if increasing slope
            if (activationValue < activation.lowerRange) { return 0 } // 1st condition: Pa < lowerRange, return 0
            weight = activationValue > activation.upperRange ?
                activation.slope * (activation.upperRange - activation.lowerRange) : // 2nd condition: Pa > upperRange, return slope * (upperRange - lowerRange)
                activation.slope * (activationValue - activation.lowerRange); // 3rd condition: Pa is between lowerRange and upperRange, return slope * (Pa - lowerRange)
        }
        else {
            if (activationValue > activation.upperRange) { return 0 } // 1st condition: Pa > upperRange, return 0
            weight = activationValue < activation.lowerRange ?
                activation.slope * (activation.upperRange - activation.lowerRange) : // 2nd condition: Pa < lowerRange, return slope * (upperRange - lowerRange)
                activation.slope * (activation.upperRange - activationValue); // 3rd condition: Pa is between lowerRange and upperRange, return slope * (upperRange - Pa)
        }
        return weight;
    }
    // 4. Unknown
    return 0;
}

export function normalizeWeight(rawActivationWeight, activeBehaviorGroup) {
  let totalWeight = 0;

  // Receives runtime group, so only normalize within the group
  for (const activeBehavior of activeBehaviorGroup) {
        totalWeight += activeBehavior.rawActivationWeight;
    }

    if (totalWeight === 0) {
        return 0;
    }

    return rawActivationWeight / totalWeight;
}

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
    this.low = low;
    this.high = high;
  }

  apply(self, entities) {
    return entities.filter(entity => {
      const value = getEntityMeasurementValue(this.propertyType, self, entity);
      if (value === null) return false;

      if (this.propertyType === MEASUREMENT_TYPES.HEADING) {
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

export function normalizeFilterDrafts(filters, ownerLabel) {
  return filters.map((filter, index) => {
    const label = `${ownerLabel} ${index + 1}`;
    const obstacleTargets = filter.targets[ENTITY_TYPES.OBSTACLE];
    const hasTarget = Object.values(ENTITY_TYPES)
      .filter((entityType) => entityType !== ENTITY_TYPES.OBSTACLE)
      .some((entityType) => filter.targets[entityType] === true)
      || obstacleTargets.enabled === true;

    if (!hasTarget) {
      throw new Error(`${label} needs at least one Target Entity Type.`);
    }
    if (
      obstacleTargets.enabled
      && !obstacleTargets[OBSTACLE_SHAPE_TYPES.CIRCLE]
      && !obstacleTargets[OBSTACLE_SHAPE_TYPES.POLYGON]
    ) {
      throw new Error(`${label} needs at least one Obstacle shape.`);
    }
    if (!Object.values(MEASUREMENT_TYPES).includes(filter.propertyType)) {
      throw new Error(`${label} needs a valid Property.`);
    }

    if (filter.filterType === 'method') {
      if (!Object.values(METHOD_TYPES).includes(filter.methodType)) {
        throw new Error(`${label} needs a valid Method.`);
      }
      return {
        ...filter,
        targets: {
          ...filter.targets,
          [ENTITY_TYPES.OBSTACLE]: { ...obstacleTargets },
        },
      };
    }

    if (filter.filterType !== 'ranged') {
      throw new Error(`${label} needs a valid Type.`);
    }

    const low = Number(filter.low);
    const high = Number(filter.high);

    if (!Number.isFinite(low) || !Number.isFinite(high)) {
      throw new Error(`${label} needs valid Low and High values.`);
    }

    if (filter.propertyType === MEASUREMENT_TYPES.HEADING) {
      if (low < 0 || low > 360 || high < 0 || high > 360) {
        throw new Error(`${label} Heading range must be between 0° and 360°.`);
      }
    } else if (
      filter.propertyType === MEASUREMENT_TYPES.HEADING_DIFFERENCE
      || filter.propertyType === MEASUREMENT_TYPES.ANGLE_TO_ENTITY
    ) {
      if (low < 0 || low > 180 || high < 0 || high > 180) {
        throw new Error(`${label} angle range must be between 0° and 180°.`);
      }
      if (low > high) {
        throw new Error(`${label} Low cannot be greater than High.`);
      }
    } else if (low > high) {
      throw new Error(`${label} Low cannot be greater than High.`);
    }

    return {
      ...filter,
      targets: {
        ...filter.targets,
        [ENTITY_TYPES.OBSTACLE]: { ...obstacleTargets },
      },
      low,
      high,
    };
  });
}

// ─── Entity value readers ────────────────────────────────────────────────────
// These functions read geometry, Filter values, or Action values from Entities.

function getEntitySpeed(entity) {
  const velocity = entity.runtimeState.behaviorVelocity ?? entity.velocity;
  const { x: dx, y: dy } = velocity;
  return Math.sqrt(dx ** 2 + dy ** 2);
}

function getEntityHeading(entity) {
  return entity.runtimeState.behaviorRotation ?? entity.transform.rotation;
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

// Now uses shortest difference angle
export function getHeadingDifferenceDeg(self, neighbor) {
  const difference = getEntityHeading(neighbor) - getEntityHeading(self);
  return Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))) * 180 / Math.PI;
}

export function getEntityCenterPoint(entity) {
  return entity?.transform.position ?? null;
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

  const { diffX, diffY } = getShortestOffset(obstacleCenter, self.transform.position, self.canvas);
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
      const { diffX, diffY } = getShortestOffset(self.transform.position, referencePosition, self.canvas);
      return Math.sqrt(diffX ** 2 + diffY ** 2);
    }
    case MEASUREMENT_TYPES.HEADING_DIFFERENCE: {
      if (!self?.hasHeading || entity.hasHeading !== true) return null;
      return getHeadingDifferenceDeg(self, entity);
    }
    case MEASUREMENT_TYPES.ANGLE_TO_ENTITY: {
      const referencePosition = getEntityReferencePosition(self, entity);
      if (!referencePosition) return null;
      // Bearing-based filters should aim at the closest obstacle boundary point.
      const { diffX, diffY } = getShortestOffset(self.transform.position, referencePosition, self.canvas);
      const bearing = Math.atan2(diffY, diffX);
      const difference = bearing - getEntityHeading(self);
      return Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))) * 180 / Math.PI;
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
      const { diffX, diffY } = getShortestOffset(self.transform.position, referencePosition, self.canvas);
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
  if (!agentFilter) {
    return entities.filter((entity) => entity.entityType === ENTITY_TYPES.AGENT);
  }

  const targets = agentFilter.targets;
  const targetedEntities = entities.filter((entity) => {
    if (!entity) return false;

    if (entity.entityType === ENTITY_TYPES.OBSTACLE) {
      const obstacleTargets = targets[ENTITY_TYPES.OBSTACLE];

      if (!obstacleTargets.enabled) return false;
      if (entity.shapeType === undefined || entity.shapeType === null) return false;
      if (!obstacleTargets[entity.shapeType]) return false;

      return true;
    }

    // More entity-specific conditional statement coming soon

    return Boolean(targets[entity.entityType]);
  });

  if (agentFilter.filterType === 'ranged')
    return new RangedFilter(agentFilter.propertyType, agentFilter.low, agentFilter.high).apply(self, targetedEntities);
  return new MethodFilter(agentFilter.propertyType, agentFilter.methodType).apply(self, targetedEntities);
}

// ─── Behavior value calculation ──────────────────────────────────────────────
// Apply Behavior Filters, then combine the qualifying Entities' Action values.
// Return a target value depending on the behavior
export function calculateBehaviorValue(behavior, self, detectedEntities) {
    const filters = behavior.filters;
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
          if (Math.hypot(sinSum, cosSum) < 1e-12) return null;
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
          if (Math.hypot(sinSum, cosSum) < 1e-12) return null;
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

  const nextAngle = currentAngle + shortestDifference * smoothingFactor;
  return Math.atan2(Math.sin(nextAngle), Math.cos(nextAngle));
}

// Smoothing Calculator (based on max angle)
export function turnTowardAngle(initial, final, maxAngle) {
  let diff = final - initial;
  if (diff > Math.PI) diff -= 2 * Math.PI;
  if (diff < -Math.PI) diff += 2 * Math.PI;
  const nextAngle = initial + Math.sign(diff) * Math.min(Math.abs(diff), maxAngle);
  return Math.atan2(Math.sin(nextAngle), Math.cos(nextAngle));
}

// ─── Activation value calculation ────────────────────────────────────────────
// Filter entities, read their properties, then combine them into one value.
export function getActivationInputValue(activation, self, detectedEntities) {
  // If source = self-property, return the self's property value
  if (activation.checkSource === "self") return getEntityMeasurementValue(activation.valueToCheck, self, self);

  // Otherwise, return null:
  if (activation.checkSource !== "neighbor") return null;

  // If source = neighbor-property, then use detectedEntities as normal
  const filters = activation.filters;

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
  const isCircular = measurementType === MEASUREMENT_TYPES.HEADING;

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

  if (Math.hypot(sinSum, cosSum) < 1e-12) return null;

  const averageRadians = Math.atan2(
    sinSum,
    cosSum
  );

  return (
    averageRadians * 180 / Math.PI + 360
  ) % 360; // return average degree
}
