export class Entity {
    constructor(id, name, entityType) {
        // Who am I?
        this.id = id;
        this.name = name; // NEW: name is different from id; id is a string created from UUID
        // What am I?
        this.entityType = entityType; // A number, defined in behavior.js

        // Perception
        this.radius = 0;
        // For example, exit does not have motion
        this.hasMotion = false;
        // Obstacle does not have a useful meaning of heading
        this.hasHeading = false;

        // For custom properties:
        this.propertyValues = {} // every entity should have a list of entities
    }
}
