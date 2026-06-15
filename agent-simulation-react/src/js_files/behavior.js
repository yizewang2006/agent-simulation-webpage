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
  RELATIVE_ANGLE: 2,
  HEADING: 3,
}

// Human-readable labels for the UI
export const PROPERTY_LABELS = {
  [TARGET_PROPERTIES.POSITION]: 'Position', // Definition: Bearing
  [TARGET_PROPERTIES.SPEED]:    'Speed',
  [TARGET_PROPERTIES.ANGLE]:    'Angle',
};

export const FILTER_LABELS = {
  [FILTER_TYPES.DISTANCE]: 'Distance',
  [FILTER_TYPES.SPEED] : 'Speed',
  [FILTER_TYPES.RELATIVE_ANGLE] : 'Relative Angle',
  [FILTER_TYPES.HEADING] : 'Heading',
}

export const METHOD_LABELS = {
  [METHOD_TYPES.CLOSEST]:  'Closest',
  [METHOD_TYPES.FARTHEST]: 'Farthest',
  [METHOD_TYPES.AVERAGE]:  'Average',
};

export const REFERENCE_TYPES = {
  NEIGHBOR_REFERENCE: 0,
  SELF_SPACE: 1,
};

export const REFERENCE_LABELS = {
  [REFERENCE_TYPES.NEIGHBOR_REFERENCE]: 'Neighbor Reference',
  [REFERENCE_TYPES.SELF_SPACE]: 'Self-Space',
};

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
    this.low = Number(low) || 0;
    this.high = Number(high) || 0;
  }

  apply(self, agents) {
    switch (this.propertyType) {
      case FILTER_TYPES.SPEED: {
        return agents.filter(filteredAgent => {
          const speed = Math.sqrt(filteredAgent.dx**2 + filteredAgent.dy**2);
          return speed >= this.low && speed <= this.high
        })
      }
      case FILTER_TYPES.RELATIVE_ANGLE: {
        return agents.filter(filteredAgent => {
          const { diffX, diffY } = offsetCorrection((filteredAgent.position.x - self.position.x), (filteredAgent.position.y - self.position.y), self.canvas);
          const bearing = (Math.atan2(diffY, diffX) * 180 / Math.PI + 360) % 360;
          return bearing >= this.low && bearing <= this.high;
        })
      }
      case FILTER_TYPES.HEADING: {
        return agents.filter(filteredAgent => {
          const heading = (filteredAgent.angle * 180 / Math.PI + 360) % 360;
          return heading >= this.low && heading <= this.high;
        });
      }
      case FILTER_TYPES.DISTANCE: {
        return agents.filter(filteredAgent => {
          const { diffX, diffY } = offsetCorrection(filteredAgent.position.x - self.position.x, filteredAgent.position.y - self.position.y, self.canvas);
          return Math.sqrt(diffX**2 + diffY**2) >= this.low && Math.sqrt(diffX**2 + diffY**2) <= this.high;
        });
      }
      default: return agents;
    }
  }
}

// METHOD FILTER
export class MethodFilter extends Filter {
  constructor(propertyType, methodType) {
    super();
    this.propertyType = propertyType;
    this.methodType = methodType;
  }

  apply(self, agents) {
    if (agents.length === 0) return [];

    // AVERAGE: pass all agents through — applyBehavior computes the average across them
    if (this.methodType === METHOD_TYPES.AVERAGE) return agents;

    const getVal = (a) => { // Calculate values based on the filtered property
      if (this.propertyType === FILTER_TYPES.SPEED)
        return Math.sqrt(a.dx**2 + a.dy**2);
      if (this.propertyType === FILTER_TYPES.HEADING)
        return (a.angle * 180 / Math.PI + 360) % 360;
      // DISTANCE and RELATIVE_ANGLE: wrap-corrected distance from self
      const { diffX, diffY } = offsetCorrection(
        a.position.x - self.position.x,
        a.position.y - self.position.y,
        self.canvas
      );
      return Math.sqrt(diffX**2 + diffY**2);
    };

    let best = agents[0];
    let bestVal = getVal(agents[0]);
    for (const a of agents) {
      const val = getVal(a);
      if (this.methodType === METHOD_TYPES.CLOSEST && val < bestVal) { best = a; bestVal = val; }
      if (this.methodType === METHOD_TYPES.FARTHEST && val > bestVal) { best = a; bestVal = val; }
    }
    return [best];
  }
}

// OBSTACLE FILTER?
export class ObstacleFilter extends Filter {

}

// Returns a list of agents — delegates to RangedFilter or MethodFilter class
function applyFilters(agentFilter, self, agents) {
  if (agentFilter.filterType === 'ranged')
    return new RangedFilter(agentFilter.propertyType, agentFilter.rangeLow, agentFilter.rangeHigh).apply(self, agents);
  if (agentFilter.filterType === 'method')
    return new MethodFilter(agentFilter.propertyType, agentFilter.methodType).apply(self, agents);
  return agents; // fallback
}

// Return a target value depending on the behavior
export function getBehaviorTarget(behavior, self, detectedAgents) {
    let detAgents = [...detectedAgents]; // All detected agents before filtering

    for (const filter of behavior.filters) {
      detAgents = applyFilters(filter, self, detAgents);
      if (detAgents.length === 0) {
        detectedAgents.forEach(agent => agent.colorHex = '#FF0000'); // failed filter but still in FOV — reset to red
        return null;
      }
    }

    if (detAgents.length > 0) {
      detAgents.forEach(a => a.colorHex = "#00FF00"); // ALL Filtered agent turns green (red color change in agent.js)

      // Behavior value calculation
      switch (behavior.targetProperty) {
        case TARGET_PROPERTIES.POSITION: {
          let sinSum = 0, cosSum = 0;
          for (const a of detAgents) {
            const {diffX, diffY} = offsetCorrection(a.position.x - self.position.x, a.position.y - self.position.y, self.canvas);
            const bearing = Math.atan2(diffY, diffX);
            sinSum += Math.sin(bearing);
            cosSum += Math.cos(bearing);
          }
          return Math.atan2(sinSum, cosSum);
        }
        case TARGET_PROPERTIES.SPEED: {
          let total = 0;
          for (const a of detAgents) total += Math.sqrt(a.dx**2 + a.dy**2);
          return total / detAgents.length;
        }
        case TARGET_PROPERTIES.ANGLE: {
          let sinSum = 0, cosSum = 0;
          for (const a of detAgents) {
            sinSum += Math.sin(a.angle);
            cosSum += Math.cos(a.angle);
          }
          return Math.atan2(sinSum, cosSum);
        }
      }
    }
    return null;
  }

export function offsetCorrection(diffX, diffY, canvas) {
  if (diffX > canvas.width / 2)        diffX -= canvas.width;
  else if (diffX < -canvas.width / 2)  diffX += canvas.width;
  if (diffY > canvas.height / 2)        diffY -= canvas.height;
  else if (diffY < -canvas.height / 2)  diffY += canvas.height;
  return { diffX, diffY };
}