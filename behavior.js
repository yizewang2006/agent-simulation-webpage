class Behavior {
    // another 3-4 components, each components has its own class (action[changing speeds, pos... -> changing properties], 
    // activation[agents have 1+ behaviors, change the properties of agents], 
    // filter[filter out what agents focus on, example: avoid obstacles | filter by distances, speed, angle, based on properties])
}

class Filter {
    // Ranged: properties & range [Speed, Position]
    // Method: property (which property are we modifying) & method (how?) [Follow Closest, Furtherst, Averaged]
}

class Property {
    get(agent) {

    }

    compare(self, target) {
        // compare self properties with target's properties (i.e. compare my own position with target agent's position)
    }
}

export class Speed extends Property {
    
}

export class Position extends Property{
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }

    // Method to update the position by adding dx and dy
    add(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    get(agent) {
        return agent.positon;
    }

    compare(self, target) {
        // yet to implement
    }
}

export class Angle extends Property {

}

class Offset {

}