// This file gives Agent behavior: movement, drawing, collision logging

import { Entity } from "./entity.js";

export class Agent extends Entity {
    constructor(isSpecial, x, y, radius, dx, dy, colorHex, fovRadius, fovAngle, angle, id, ctx, canvas) {
        super(id);
        this.position = { x, y };
        this.dx = dx;
        this.dy = dy;
        this.radius = radius;
        this.canvas = canvas;
        this.ctx = ctx;
        this.colorHex = colorHex;
        this.originalColor = colorHex;
        this.isSpecial = isSpecial;
        this.fovRadius = fovRadius;
        this.fovAngle = fovAngle;
        this.angle = angle;
        this.id = id;
        this.collisionLog = []; // { with: agentId, time: seconds }
        this.collisionsThisFrame = new Set(); // Track collisions this frame to avoid duplicates
    }

    // =============================
    // Update movement
    // =============================
    updatePosition(agents = []) {
        this.position.x += this.dx;
        this.position.y += this.dy;
        
        // Update angle to match current velocity direction
        this.angle = Math.atan2(this.dy, this.dx);
        
        this.handleBoundary();
        this.clearCollisionsThisFrame(); // Clear collision tracking from last frame
        this.draw();
        
        // Draw collision predictions if agents array is provided
        if (agents.length > 0) {
            this.drawCollisionPredictions(agents);
        }
    }

    // =============================
    // Clear collision tracking for new frame
    // =============================
    clearCollisionsThisFrame() {
        this.collisionsThisFrame.clear();
    }

    // =============================
    // Boundary wrapping (toroidal space)
    // =============================
    handleBoundary() {
        // Left edge → reappear on right
        if (this.position.x + this.radius < 0) {
            this.position.x = this.canvas.width + this.radius;
        // Right edge → reappear on left
        } else if (this.position.x - this.radius > this.canvas.width) {
            this.position.x = -this.radius;
        }

        // Top edge → reappear on bottom
        if (this.position.y + this.radius < 0) {
            this.position.y = this.canvas.height + this.radius;
        // Bottom edge → reappear on top
        } else if (this.position.y - this.radius > this.canvas.height) {
            this.position.y = -this.radius;
        }
    }

    // =============================
    // Draw agent (simple version with FOV cone)
    // =============================
    draw() {
        const ctx = this.ctx;
        
        // Draw FOV cone (optional - semi-transparent)
        if (this.fovRadius > 0) {
            ctx.save();
            ctx.globalAlpha = 0.15; // Very subtle
            ctx.fillStyle = this.colorHex;
            ctx.beginPath();
            ctx.moveTo(this.position.x, this.position.y);
            ctx.arc(
                this.position.x,
                this.position.y,
                this.fovRadius,
                this.angle - this.fovAngle / 2,
                this.angle + this.fovAngle / 2
            );
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        
        // Draw agent circle (main body)
        ctx.beginPath();
        ctx.arc(
            this.position.x,
            this.position.y,
            this.radius,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = this.colorHex;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.closePath();
    }

    // =============================
    // Report information for recording
    // =============================
    reportInformation() {
        return {
            x: this.position.x,
            y: this.position.y,
            color: this.colorHex,
            id: this.id,
            radius: this.radius,
            velocity: { dx: this.dx, dy: this.dy }
        };
    }

    // =============================
    // COLLISION DETECTION (Physics-based - Quadratic Equation)
    // =============================

    /**
     * Check if this agent is CURRENTLY COLLIDING with another agent
     * Uses circle-circle collision: distance between centers <= sum of radii
     * ANY overlap of the circular bodies counts as collision
     * 
     * @param {Agent} other - The other agent to check
     * @returns {boolean} - True if circles overlap
     */
    isCollidingWith(other) {
        // Calculate distance between centers
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        const distanceSquared = dx * dx + dy * dy;
        
        // Sum of radii (collision distance)
        const radiusSum = this.radius + other.radius;
        const radiusSumSquared = radiusSum * radiusSum;
        
        // Collision occurs when distance <= sum of radii
        return distanceSquared <= radiusSumSquared;
    }

    /**
     * Calculate time to collision with another agent
     * Uses quadratic equation: when does distance between centers equal sum of radii?
     * 
     * @param {Agent} other - The other agent
     * @returns {number|null} - Time in frames until collision, or null if no collision
     */
    timeToCollision(other) {
        // Relative position (from this agent to other)
        const rx = other.position.x - this.position.x;
        const ry = other.position.y - this.position.y;

        // Relative velocity (other's velocity relative to this)
        const rvx = other.dx - this.dx;
        const rvy = other.dy - this.dy;

        // Sum of radii (collision distance)
        const radiusSum = this.radius + other.radius;

        // Build quadratic equation: a·t² + b·t + c = 0
        // where distance² at time t = (r₀ + rv·t)² = R²
        const a = rvx * rvx + rvy * rvy;           // |rv|²
        const b = 2 * (rx * rvx + ry * rvy);       // 2·(r₀·rv)
        const c = rx * rx + ry * ry - radiusSum * radiusSum;  // |r₀|² - R²

        // Case 1: No relative velocity (agents moving together)
        if (a === 0) {
            // Already colliding?
            if (c <= 0) return 0;
            return null;
        }

        // Case 2: Calculate discriminant
        const discriminant = b * b - 4 * a * c;
        
        // Discriminant < 0: paths never intersect
        if (discriminant < 0) {
            return null;
        }

        // Case 3: Solve quadratic equation
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDiscriminant) / (2 * a);
        const t2 = (-b + sqrtDiscriminant) / (2 * a);

        // Take the earliest collision time
        const t = Math.min(t1, t2);

        // Only return if collision happens in the future (t >= 0)
        return t >= 0 ? t : null;
    }

    /**
     * Get the collision point (where circles will touch/overlap)
     * 
     * @param {Agent} other - The other agent
     * @returns {object|null} - { x, y, time } or null if no collision
     */
    getCollisionPoint(other) {
        const t = this.timeToCollision(other);
        if (t === null) return null;
        
        return {
            x: this.position.x + this.dx * t,
            y: this.position.y + this.dy * t,
            time: t
        };
    }

    /**
     * Get distance between centers of two agents
     * 
     * @param {Agent} other - The other agent
     * @returns {number} - Distance between centers
     */
    getDistance(other) {
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Get how much two agents are overlapping
     * Positive value = amount of overlap in pixels
     * Zero or negative = not colliding
     * 
     * @param {Agent} other - The other agent
     * @returns {number} - Overlap amount
     */
    getOverlapAmount(other) {
        const distance = this.getDistance(other);
        const radiusSum = this.radius + other.radius;
        return radiusSum - distance;
    }

    /**
     * Record a collision with another agent (prevents duplicate recording)
     * 
     * @param {Agent} other - The other agent
     * @param {number} time - Current simulation time in seconds
     */
    recordCollision(other, time) {
        // Only record if not already recorded this frame
        if (!this.collisionsThisFrame.has(other.id)) {
            this.collisionLog.push({
                with: other.id,
                time: time,
                otherColor: other.colorHex
            });
            this.collisionsThisFrame.add(other.id);
        }
    }

    // =============================
    // Draw collision predictions
    // =============================
    /**
     * Draw predicted collision points with all other agents
     * Shows where collisions will occur if trajectories are maintained
     * 
     * @param {Array} agents - All agents in simulation
     */
    drawCollisionPredictions(agents) {
        const ctx = this.ctx;
        
        agents.forEach(other => {
            if (other === this) return;
            
            const t = this.timeToCollision(other);
            
            // Only show predictions for near-future collisions
            if (t !== null && t < 100 && t >= 0) {
                const collision = this.getCollisionPoint(other);
                if (!collision) return;

                ctx.save();
                
                // Draw collision point marker
                ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                ctx.lineWidth = 2;
                
                // Draw X at collision point
                const size = 8;
                ctx.beginPath();
                ctx.moveTo(collision.x - size, collision.y - size);
                ctx.lineTo(collision.x + size, collision.y + size);
                ctx.moveTo(collision.x + size, collision.y - size);
                ctx.lineTo(collision.x - size, collision.y + size);
                ctx.stroke();
                
                // Draw circle around collision point
                ctx.beginPath();
                ctx.arc(collision.x, collision.y, 10, 0, Math.PI * 2);
                ctx.stroke();
                
                // Draw time label
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`${collision.time.toFixed(1)}f`, collision.x + 15, collision.y - 15);
                
                ctx.restore();
            }
        });
    }

    // =============================
    // Collision response
    // =============================

    /**
     * Simple velocity swap (equal mass elastic collision)
     * 
     * @param {Agent} other - The other agent
     */
    bounceWith(other) {
        // Simple velocity swap (equal mass assumption)
        const tempDx = this.dx;
        const tempDy = this.dy;
        this.dx = other.dx;
        this.dy = other.dy;
        other.dx = tempDx;
        other.dy = tempDy;
    }

    /**
     * Separate overlapping agents to prevent sticking
     * Moves agents apart along the collision normal
     * 
     * @param {Agent} other - The other agent
     */
    separateFrom(other) {
        const overlap = this.getOverlapAmount(other);
        if (overlap <= 0) return; // Not overlapping
        
        // Get direction from this agent to other
        const dx = other.position.x - this.position.x;
        const dy = other.position.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return; // Same position, can't separate
        
        // Normalize direction
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separate equally (each moves half the overlap distance)
        const separationDist = (overlap / 2) + 0.5; // +0.5 for safety margin
        
        this.position.x -= nx * separationDist;
        this.position.y -= ny * separationDist;
        
        other.position.x += nx * separationDist;
        other.position.y += ny * separationDist;
    }

    /**
     * Get detailed collision status with another agent
     * 
     * @param {Agent} other - The other agent
     * @returns {object} - { isColliding, overlap, distance, timeToCollision }
     */
    getCollisionStatus(other) {
        const isColliding = this.isCollidingWith(other);
        const overlap = this.getOverlapAmount(other);
        const distance = this.getDistance(other);
        const timeToCollision = this.timeToCollision(other);
        
        return {
            isColliding,
            overlap: Math.max(0, overlap),
            distance,
            timeToCollision,
            other: other.id
        };
    }

    /**
     * Get all current collisions with other agents
     * 
     * @param {Array} agents - All other agents to check
     * @returns {Array} - Array of collision status objects
     */
    getAllCollisions(agents) {
        return agents
            .filter(agent => agent !== this)
            .map(agent => this.getCollisionStatus(agent))
            .filter(collision => collision.isColliding);
    }
}