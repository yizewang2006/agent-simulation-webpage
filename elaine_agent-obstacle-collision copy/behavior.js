export class Behavior {
    constructor(filters = []) {
        this.filters = filters;
    }

    apply(self, agents) {
        let targets = agents.filter(a => a !== self);

        for (let filter of this.filters) {
            targets = filter.apply(self, targets);
        }

        return targets;
    }
}


export class Filter {
    apply(self, targets) {
        return targets;
    }
}

export class RangedFilter extends Filter {
    constructor(property, lower, upper) {
        super();
        this.property = property;
        this.lower = lower;
        this.upper = upper;
    }

    apply(self, targets) {
        return targets.filter(target => {
            const value = this.property.compare(self, target);
            return value >= this.lower && value <= this.upper;
        });
    }
}

export class MethodFilter extends Filter {
    constructor(property, method, n = 1) {
        super();
        this.property = property;
        this.method = method;
        this.n = n;
    }

    apply(self, targets) {
        if (this.method === "closest") {
            return [this.property.findNthClosest(self, targets, this.n)];
        }

        if (this.method === "average") {
            return [this.property.findAverage(self, targets)];
        }

        return targets;
    }
}


class Property {
    get(agent) {

    }

    compare(self, target) {
        // compare self properties with target's properties (i.e. compare my own position with target agent's position)
    }
}

export class Speed extends Property {

    get(agent) {
        return Math.sqrt(agent.dx * agent.dx + agent.dy * agent.dy);
    }

    compare(self, target) {
        return this.get(target) - this.get(self);
    }
}


export class Position extends Property {

    get(agent) {
        return agent.position;
    }

    compare(self, target) {
        return this.distance(self.position, target.position);
    }

    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findAverage(self, targets) {
        if (!targets || targets.length === 0) return null;

        let avgX = 0;
        let avgY = 0;

        for (let target of targets) {
            avgX += target.position.x;
            avgY += target.position.y;
        }

        avgX /= targets.length;
        avgY /= targets.length;

        return { x: avgX, y: avgY };
    }

    findNthClosest(self, targets, n) {
        if (!targets || targets.length === 0) return null;

        targets.sort((a, b) =>
            this.compare(self, a) - this.compare(self, b)
        );

        return targets[n - 1] || null;
    }
}


export class Angle extends Property {

    get(agent) {
        return agent.angle;
    }

    compare(self, target) {
        return target.angle - self.angle;
    }
}
