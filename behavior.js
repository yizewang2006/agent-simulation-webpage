class Behavior {
    // another 3-4 components, each components has its own class (action[changing speeds, pos... -> changing properties], 
    // activation[agents have 1+ behaviors, change the properties of agents], 
    // filter[filter out what agents focus on, example: avoid obstacles | filter by distances, speed, angle, based on properties])

    filters = []; // list of filters
}

class Filter {
    // Ranged: properties & range [Speed, Position]
    // Method: property (which property are we modifying) & method (how?) [Follow Closest, Furtherst, Averaged]

    //Property filterProperty = typeOfProperty; // speed, position, or angle
    //Type:  refer to above ranged/method
    property = new Property();
}

class RangedFilter extends Filter {
    // Lower/Upper bounds 
    // Refer to filterProperty

    // double lower = ?, upper = ?;
    // Property filterProperty = super.filterProperty;
    // We do it with object, speed isn't related to agent's speed
}

class MethodFilter extends Filter {

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

    }

    compare(self, target) {

    }
}

export class Position extends Property{ // This will be the Position class the agent is using, replaces previous one
    constructor(x, y) {
        super(); // call super's constructor
        this.x = x;
        this.y = y;
    }

    // Method to update the position by adding dx and dy
    add(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    get(agent) {
        return agent.position;
    }

    findAverage(self, targets) {
        // Find the central position
        
        //?
        avgX = 0;
        avgY = 0;

        for (target of targets) { // target = Agent, targets = array of Agent
            avgX += target.position.x;
            avgY += target.position.y
        }

        avgX /= targets.length;
        avgY /= targets.length;

        return new Position()

        // 
        
    }

    findNthClosest(self, targets, n) { // Will return the Agent that is nth closest to self from targets
        // self = Agent
        // targets = Agent Array
        // n = int, indicating which one

        // Using Quick Select Algorithm to find nth closest Agent

        if (!targets || targets.length == 0) {
            console.log("There are no agents available for detection");
            return null;
        }

        if (n < 1 || n > targets.length) {
            console.log("invalid n");
            return null;
        }

        return this.quickSelect(targets, n-1, self);
    }
    
    quickSelect(targets, n, self) {
        if (targets.length === 1) return targets[0]; // if there's only one, return that (that must be the closest)

        const pivot = targets[Math.floor(Math.random() * targets.length)] // select a pivot
        const pivotDistFromSelf = self.position.distanceTo(pivot.position);
        
        const left = [], equal = [], right = [];

        for (let agent of targets) {
            let d = self.position.distanceTo(agent.position);
            if (d < pivotDistFromSelf) left.push(agent);
            else if (d > pivotDistFromSelf) right.push(agent);
            else equal.push(agent);
        }

        if (n < left.length) {
            return this.quickSelect(left, n, self);
        } else if (n < left.length + equal.length) {
            return pivot;
        } else {
            return this.quickSelect(right, n - left.length - equal.length, self);
        }
    }

    distanceTo(position) {
        const diffX = this.x - position.x;
        const diffY = this.y - position.y
        // Corrected by ChatGPT for Warping
        if (diffX > width / 2) diffX = width - diffX;
        if (diffY > height / 2) diffY = height - diffY;

        return Math.sqrt(diffX * diffX + diffY * diffY);
    }

}

export class Angle extends Property {

}

class Offset {

}