import { parseNumberCap } from "../utils/utilities.js";

export class Entity {
    constructor(id, name, entityType, position, rotation = 0, velocity = { x: 0, y: 0 }, shapes = []) {
        // Who am I?
        this.id = id;
        this.name = name; // NEW: name is different from id; id is a string created from UUID
        // What am I?
        this.entityType = entityType; // A number defined in constants.js

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
        this.propertyValues = {} // Values assigned from this Entity's Property definitions
    }

    // Draw logic
    draw(ctx, transform = this.transform, appearance) {
        this.shapes.forEach((shape) => shape.draw(ctx, transform, appearance));
    }

    // Phase 1: move and wrap — rendering is handled separately by the simulation.
    move(canvasWidth, canvasHeight, maxSpeed = null) {
        this.transform.position.x += this.velocity.x;
        this.transform.position.y += this.velocity.y;

        if (this.hasHeading && (this.velocity.x !== 0 || this.velocity.y !== 0)) {
            this.transform.rotation = Math.atan2(this.velocity.y, this.velocity.x);
        }

        if (maxSpeed !== null) {
            const speedCap = parseNumberCap(maxSpeed);
            const currentSpeed = Math.hypot(this.velocity.x, this.velocity.y);
            if (currentSpeed > speedCap) {
                const scale = speedCap / currentSpeed;
                this.velocity.x *= scale;
                this.velocity.y *= scale;
            }
        }

        if (this.transform.position.x >= canvasWidth) {
            this.transform.position.x -= canvasWidth;
        } else if (this.transform.position.x < 0) {
            this.transform.position.x += canvasWidth;
        }

        if (this.transform.position.y >= canvasHeight) {
            this.transform.position.y -= canvasHeight;
        } else if (this.transform.position.y < 0) {
            this.transform.position.y += canvasHeight;
        }
    }

    getVirtualOffsets(canvasWidth, canvasHeight, padding = 0) {
        const bounds = this.getBounds();
        let horizontalOffset = 0;
        let verticalOffset = 0;

        if (bounds.maxX + padding > canvasWidth) {
            horizontalOffset = -canvasWidth;
        } else if (bounds.minX - padding < 0) {
            horizontalOffset = canvasWidth;
        }

        if (bounds.maxY + padding > canvasHeight) {
            verticalOffset = -canvasHeight;
        } else if (bounds.minY - padding < 0) {
            verticalOffset = canvasHeight;
        }

        const offsets = [];
        if (horizontalOffset !== 0) offsets.push({ x: horizontalOffset, y: 0 });
        if (verticalOffset !== 0) offsets.push({ x: 0, y: verticalOffset });
        if (horizontalOffset !== 0 && verticalOffset !== 0) {
            offsets.push({ x: horizontalOffset, y: verticalOffset });
        }
        return offsets;
    }

    // Returns the radius of the smallest origin-centered circle containing every Shape.
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

    // Returns the combined axis-aligned bounds of every Shape in world coordinates.
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
