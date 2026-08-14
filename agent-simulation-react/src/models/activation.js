import { MEASUREMENT_TYPES } from "../utils/constants.js";

export const ACTIVATION_TYPES = Object.freeze({
  BINARY: "binary",
  LINEAR: "linear",
  ALWAYS_ACTIVE: "always-active",
});

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
  return createDefaultActivation({
    ...savedActivation,
    lowerRange: String(savedActivation?.lowerRange ?? 0),
    upperRange: String(savedActivation?.upperRange ?? 1),
    weight: String(savedActivation?.weight ?? 1),
    slope: String(savedActivation?.slope ?? 1),
    fallbackWeight: String(savedActivation?.fallbackWeight ?? 0),
    filters: Array.isArray(savedActivation?.filters)
      ? savedActivation.filters.map((filter) => ({ ...filter }))
      : [],
  });
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
  if (!Number.isFinite(lowerRange) || !Number.isFinite(upperRange)) {
    throw new Error("Activation Lower and Upper Range must be valid numbers.");
  }
  if (lowerRange > upperRange) {
    throw new Error("Activation Lower Range cannot exceed Upper Range.");
  }

  const common = {
    type,
    valueToCheck: Number(draft.valueToCheck),
    checkSource: draft.checkSource,
    lowerRange,
    upperRange,
    nullActivation: Boolean(draft.nullActivation),
    filters: Array.isArray(draft.filters)
      ? draft.filters.map((filter) => ({ ...filter }))
      : [],
  };

  if (common.nullActivation) {
    const fallbackWeight = Number(draft.fallbackWeight);
    if (!Number.isFinite(fallbackWeight) || fallbackWeight < 0) {
      throw new Error("No-Entity Weight must be zero or greater.");
    }
    common.fallbackWeight = fallbackWeight;
  }

  if (!Object.values(MEASUREMENT_TYPES).includes(common.valueToCheck)) {
    throw new Error("Choose a valid Value to Check.");
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
