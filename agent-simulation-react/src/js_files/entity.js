export class Entity {
    constructor(ID, entityType) {
        // Who am I?
        this.ID = ID;
        // What am I?
        this.entityType = entityType; // A number, defined in behavior.js

        // Perception
        this.position = null;
        this.radius = 0;
        // For example, exit does not have motion
        this.hasMotion = false;
        // Obstacle does not have a useful meaning of heading
        this.hasHeading = false;
    }
}
