import { Entity } from "./entity.js";
import { Position, Angle, Speed, getBehaviorTarget, getWrappedOffset, smoothTowardAngle, turnTowardAngle, TARGET_PROPERTIES, REFERENCE_TYPES } from "./behavior.js";

class fovOffset {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

function parseNumberCap(value) {
    if (value === '' || value === null || value === undefined) return Infinity;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : Infinity;
}

function parseNumberOrDefault(value, fallback) {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export class Agent extends Entity{
    constructor(isSpecial, x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = 5 * Math.PI / 6, angle=0, id, ctx, canvas, roster) { // Standard FOV = 150 degrees OR 5π/6
        console.log("A new agent called " + id + " has been created");
        super();
        // Instead of separate x and y, we now use a Position() class
        this.isSpecial = isSpecial;
        this.position = new Position(x, y);
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        // 25.2.17 FIX: ANGLE INDEPENDENT OF dy & dx
        this.angle = angle; // We have now set the angle to be independent of dy & dx
        this.steeringAngle = angle;
        this.turnSmoothing = 0.15;
        this.colorHex = colorHex;  // Default color
        this.originalColor = colorHex; // Store original color: won't change, java
        this.fovRadius = fovRadius; // FOV range of detection
        this.fovAngle = fovAngle;
        // Initialize an empty array to hold detected agents
        this.detectedAgents = [];
        this.id = id;
        // 26.1.28 Context and Canvas reference for scalability (now accepts passed-in context and canvas)
        this.ctx = ctx;
        this.canvas = canvas;
        this.roster = roster;
        // Add this agent to the roster if provided
        if (roster != null) roster.push(this); // Add this agent to the roster if provided
    }   

    generateRandomColor() {
        const possibleColor = [
            "#000000", // Black
            "#FF0000", // Red
            "#00FF00", // Green
            "#0000FF", // Blue
            "#FFFF00", // Yellow
            "#FF00FF", // Magenta
            "#00FFFF", // Cyan
            "#FFA500", // Orange
            "#800080", // Purple
            "#FFC0CB"  // Pink
          ];
        const randomIndex = Math.floor(Math.random() * possibleColor.length); // ChatGPT told me to round it down?
        this.colorHex = possibleColor[randomIndex];
    }

    // Method to draw the circle
    draw() {
        // this.showFOV is attached by Simulation.jsx, by React, not in the Agent class itself. It is a global setting that each agent can access to determine whether to draw FOV or not.
        const shouldDrawFOV = this.isSpecial && this.showFOV !== false;
        const virtualRange = this.radius + (shouldDrawFOV ? this.fovRadius : 0);
        const virtualOffsets = this.getVirtualOffsets(virtualRange);

        for (const offset of virtualOffsets) {
            this.drawVirtualCopyAtOffset(offset, shouldDrawFOV);
        }
        this.drawVirtualCopyAtOffset(new fovOffset(0, 0), shouldDrawFOV);
    }

    drawVirtualCopyAtOffset(offset, drawFOV = false) {
        const x = this.position.x + offset.x;
        const y = this.position.y + offset.y;

        if (drawFOV) {
            const startAngle = this.angle - this.fovAngle / 2;
            const endAngle = this.angle + this.fovAngle / 2;

            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.arc(x, y, this.fovRadius, startAngle, endAngle);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
            this.ctx.fill();
            this.ctx.closePath();
        }

        // Draw the circle itself and hollow.
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.colorHex;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();

        // Draw movement direction segment
        const angle = this.angle;
        const segmentLength = this.radius * 2

        const endX = x + Math.cos(angle) * segmentLength;
        const endY = y + Math.sin(angle) * segmentLength;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    getVirtualOffsets(range) {
        let horizontalOffset = 0, verticalOffset = 0;

        if (this.position.x + range > this.canvas.width) {
            horizontalOffset = -this.canvas.width;
        } else if (this.position.x - range < 0) {
            horizontalOffset = this.canvas.width;
        }

        if (this.position.y + range > this.canvas.height) {
            verticalOffset = -this.canvas.height;
        } else if (this.position.y - range < 0) {
            verticalOffset = this.canvas.height;
        }

        const offsets = [];
        if (horizontalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, 0));
        if (verticalOffset !== 0) offsets.push(new fovOffset(0, verticalOffset));
        if (horizontalOffset !== 0 && verticalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, verticalOffset));
        return offsets;
    }

    // Phase 1: move, warp, and draw — all agents run this before any behavior is applied
    move(maxSpeed = null) {
        this.position.add(this.dx, this.dy);
        if (this.dx !== 0 || this.dy !== 0) {
            this.angle = Math.atan2(this.dy, this.dx);
        }
        if (maxSpeed !== null) {
            const speedCap = parseNumberCap(maxSpeed);
            const currentSpeed = Math.sqrt(this.dx ** 2 + this.dy ** 2);
            if (currentSpeed > speedCap) {
                const scale = speedCap / currentSpeed;
                this.dx *= scale;
                this.dy *= scale;
            }
        }
        this.warpAgent();
        this.draw();
    }

    // Phase 2: detect and apply behaviors using consistent post-move positions
    behave(allAgents, behaviors = [], maxSpeed = null, maxAngle = null) {
        this.detectAgents(allAgents);
        let sinSum = 0, cosSum = 0, angleCount = 0;
        const speedCap = parseNumberCap(maxSpeed);
        const angleCap = parseNumberCap(maxAngle) * Math.PI / 180;

        for (const behavior of behaviors) {
            const offset = parseNumberOrDefault(behavior.offset, 0);

            if (behavior.action === REFERENCE_TYPES.SELF_SPACE) {
                switch (behavior.targetProperty) {
                    case TARGET_PROPERTIES.SPEED: {
                        const currentSpeed = Math.sqrt(this.dx ** 2 + this.dy ** 2);
                        const newSpeed = Math.min(Math.max(0, currentSpeed + offset), speedCap);
                        this.dx = Math.cos(this.angle) * newSpeed;
                        this.dy = Math.sin(this.angle) * newSpeed;
                        break;
                    }
                    case TARGET_PROPERTIES.ANGLE:
                    case TARGET_PROPERTIES.POSITION: {
                        const desired = this.angle + offset * Math.PI / 180;
                        sinSum += Math.sin(desired);
                        cosSum += Math.cos(desired);
                        angleCount++;
                        break;
                    }
                }
                continue;
            }

            const targetVal = getBehaviorTarget(behavior, this, this.detectedAgents);

            if (targetVal !== null && targetVal !== undefined) {
                switch (behavior.targetProperty) {
                    case TARGET_PROPERTIES.SPEED: {
                        const currentSpeed = Math.sqrt(this.dx ** 2 + this.dy ** 2);
                        const base = (behavior.action === REFERENCE_TYPES.NEIGHBOR_REFERENCE) ? targetVal : currentSpeed;
                        const newSpeed = Math.min(Math.max(0, base + offset), speedCap);
                        this.dx = Math.cos(this.angle) * newSpeed;
                        this.dy = Math.sin(this.angle) * newSpeed;
                        break;
                    }
                    case TARGET_PROPERTIES.ANGLE: {
                        const base = behavior.action === REFERENCE_TYPES.NEIGHBOR_REFERENCE ? targetVal : this.angle;
                        const desired = base + offset * Math.PI / 180;
                        sinSum += Math.sin(desired);
                        cosSum += Math.cos(desired);
                        angleCount++;
                        break;
                    }
                    case TARGET_PROPERTIES.POSITION: {
                        const base = behavior.action === REFERENCE_TYPES.NEIGHBOR_REFERENCE ? targetVal : this.angle;
                        const desired = base + offset * Math.PI / 180;
                        sinSum += Math.sin(desired);
                        cosSum += Math.cos(desired);
                        angleCount++;
                        break;
                    }
                }
            }
        }
        if (angleCount > 0) {
            const desiredAngle = Math.atan2(sinSum / angleCount, cosSum / angleCount);
            this.steeringAngle = smoothTowardAngle(this.steeringAngle, desiredAngle, this.turnSmoothing);
            this.angle = turnTowardAngle(this.angle, this.steeringAngle, angleCap);

            const currentSpeed = Math.min(Math.sqrt(this.dx ** 2 + this.dy ** 2), speedCap);
            this.dx = Math.cos(this.angle) * currentSpeed;
            this.dy = Math.sin(this.angle) * currentSpeed;
        }
    }

    // Wrap to the other side of the canvas if out of bounds
    warpAgent() {
        if (this.position.x >= this.canvas.width) {
            this.position.x -= this.canvas.width;
        } else if (this.position.x < 0) {
            this.position.x += this.canvas.width;
        }

        if (this.position.y >= this.canvas.height) {
            this.position.y -= this.canvas.height;
        } else if (this.position.y < 0) {
            this.position.y += this.canvas.height;
        }
    }

    // Detection system to identify agents inside FOV
    detectAgents(agents) {
        let currentlyDetected = [];

        // Loop through all agents to check if they are within FOV
        agents.forEach(agent => {
            if (agent !== this) { // Don't detect self
                const { diffX, diffY } = getWrappedOffset(this.position, agent.position, this.canvas);
    
                let distanceBetweenAgents = Math.sqrt(diffX * diffX + diffY * diffY);
                
                // Check if within FOV radius
                if (distanceBetweenAgents <= this.fovRadius + agent.radius) {
                    let targetAngle = Math.atan2(diffY, diffX);
                    // 2.17 FIX: ANGLE INDEPENDENT OF dy & dx
                    let currentAgentAngle = this.angle;
                    
                    let angleDifference = Math.abs(currentAgentAngle - targetAngle);
                    if (angleDifference > Math.PI) angleDifference = (2 * Math.PI) - angleDifference;
                    
                    // Check if within FOV angle
                    if (angleDifference <= this.fovAngle / 2) {
                        currentlyDetected.push(agent);
                        // Only change to red if this agent wasn't detected in the previous update
                        // if (!this.detectedAgents.includes(agent)) {
                        //     agent.colorHex = '#FF0000';
                        // }
                    }
                }
            }
        });
        
        // For any agent that was previously detected but is no longer in the current list,
        // reset its color to original.
        this.detectedAgents.forEach(agent => {
            if (!currentlyDetected.includes(agent)) {
                // agent.colorHex = agent.originalColor; // Line changing color to red is in behavior.js
            }
        });

        // Update the detectedAgents list for the next update cycle.
        this.detectedAgents = currentlyDetected;
    }

    // DEMO ONLY. DISUSED
    follow(target) {
        if (!target) return;

        // Calculate the vector from this agent to the target
        let { diffX, diffY } = getWrappedOffset(this.position, target.position, this.canvas);

        // Normalize the vector
        let dist = Math.sqrt(diffX * diffX + diffY * diffY);
        if (dist === 0) return;

        diffX /= dist;
        diffY /= dist;

        // Set a "desired speed"
        const speed = 1; // tweak this number as needed
        this.dx = diffX * speed;
        this.dy = diffY * speed;

        // Update facing angle
        this.angle = Math.atan2(this.dy, this.dx);
        }
    
    // for simulation - we report both important properties and attributes
    reportInformation() {
        return {
            _drawFOV: this.drawFOV,
            _x: this.position.x,
            _y: this.position.y,
            _radius : this.radius,
            _dx: this.dx,
            _dy: this.dy,
            _colorHex: this.colorHex,
            _fovRadius: this.fovRadius,
            _fovAngle: this.fovAngle,
            _angle: this.angle,
            _id: this.id
        }
    }
}