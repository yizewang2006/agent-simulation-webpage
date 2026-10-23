export class Entity {
    constructor(id, name, entityType, position, rotation = 0, velocity = { x: 0, y: 0 }, shapes = []) {
        // Who am I?
        this.id = id;
        this.name = name; // NEW: name is different from id; id is a string created from UUID
        // What am I?
        this.entityType = entityType; // A number, defined in behavior.js

        // State owned by this Entity instance.
        this.transform = {
            position,
            rotation,
        };
        this.velocity = velocity;
        this.runtimeState = {};
        this.shapes = shapes;

        // For example, exit does not have motion
        this.hasMotion = false;
        // Obstacle does not have a useful meaning of heading
        this.hasHeading = false;

        // For custom properties:
        this.propertyValues = {} // every entity should have a list of entities
    }

    draw(ctx, transform = this.transform, appearance) {
        this.shapes.forEach((shape) => shape.draw(ctx, transform, appearance));
    }

    getBoundingRadius() {
        return this.shapes.reduce(
            (radius, shape) => Math.max(radius, shape.getBoundingRadius()),
            0
        );
    }

    getClosestPointTo(position) {
        let closestPoint = null;
        let closestDistance = Infinity;
        this.shapes.forEach((shape) => {
            const point = shape.getClosestPointTo(position, this.transform);
            const distance = Math.hypot(position.x - point.x, position.y - point.y);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        });
        return closestPoint;
    }

    getBounds() {
        const bounds = this.shapes.map((shape) => shape.getBounds(this.transform));
        return {
            minX: Math.min(...bounds.map((item) => item.minX)),
            minY: Math.min(...bounds.map((item) => item.minY)),
            maxX: Math.max(...bounds.map((item) => item.maxX)),
            maxY: Math.max(...bounds.map((item) => item.maxY)),
        };
    }

    containsPoint(point, tolerance = 0) {
        return this.shapes.some((shape) => (
            shape.containsPoint(point, this.transform, tolerance)
        ));
    }
}
