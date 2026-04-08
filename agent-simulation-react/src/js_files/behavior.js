// ─── Constants (numeric identifiers used in computation & UI) ────────────────

export const PROPERTY_TYPE = {
  POSITION: 0,
  SPEED:    1,
  ANGLE:    2,
};

export const METHOD_TYPE = {
  CLOSEST:  0,
  SMALLEST: 1,
  AVERAGE:  2,
};

// Human-readable labels for the UI
export const PROPERTY_LABELS = {
  [PROPERTY_TYPE.POSITION]: 'Position',
  [PROPERTY_TYPE.SPEED]:    'Speed',
  [PROPERTY_TYPE.ANGLE]:    'Angle',
};

export const METHOD_LABELS = {
  [METHOD_TYPE.CLOSEST]:  'Closest',
  [METHOD_TYPE.SMALLEST]: 'Smallest',
  [METHOD_TYPE.AVERAGE]:  'Average',
};

// ─── Behaviors ─────────────────────────────────────────────────────────────────

export class Behavior {
  filters = []; // list of Filter instances

  addFilter(filter) {
    this.filters.push(filter);
  }

  removeFilter(index) {
    this.filters.splice(index, 1);
  }

  // Applies all filters in sequence and returns surviving agents
  // TODO: implement chaining logic
  apply(_self, agents) {
    return agents;
  }
}

// ─── Filter (base, parent of RangedFilter and MethodFilter) ────────────────────────────────────────────────────────────

export class Filter {
  /**
   * @param {number} propertyType - PROPERTY_TYPE.*
   */
  constructor(propertyType) {
    this.propertyType = propertyType;
  }

  // Placeholder: subclasses override this
  apply(_self, agents) {
    return agents;
  }
}

// ─── RangedFilter ─────────────────────────────────────────────────────────────

export class RangedFilter extends Filter {
  /**
   * @param {number} propertyType - PROPERTY_TYPE.*
   * @param {number} low
   * @param {number} high
   */
  constructor(propertyType, low, high) {
    super(propertyType);
    this.low  = low;
    this.high = high;
  }

  // TODO: filter agents whose property value falls within [low, high]
  apply(_self, agents) {
    return agents;
  }
}

// ─── MethodFilter ─────────────────────────────────────────────────────────────

export class MethodFilter extends Filter {
  /**
   * @param {number} propertyType - PROPERTY_TYPE.*
   * @param {number} methodType   - METHOD_TYPE.*
   */
  constructor(propertyType, methodType) {
    super(propertyType);
    this.methodType = methodType;
  }

  // TODO: select agent(s) based on method (closest, smallest, average)
  apply(_self, agents) {
    return agents;
  }
}

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
