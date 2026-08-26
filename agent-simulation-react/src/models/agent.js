import { Entity } from "./entity.js";
import { calculateBehaviorValue,
    getActivationInputValue,
    getEntityCenterPoint,
    getEntityDetectionPoints,
    getShortestOffset,
    smoothTowardAngle,
    turnTowardAngle } from "./behavior.js";
import { calculateActivationWeight, normalizeWeight } from "./activation.js";
import { TARGET_PROPERTIES, REFERENCE_TYPES, ENTITY_TYPES, OBSTACLE_SHAPE_TYPES } from "../utils/constants.js";
import { getCanvasLogicalHeight, getCanvasLogicalWidth, parseNumberCap, parseNumberOrDefault } from "../utils/utilities.js";
import { BEHAVIOR_GROUPS } from "../utils/behaviorGroups.js";

class fovOffset {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

export class Agent extends Entity{
    constructor(isSpecial, x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = 5 * Math.PI / 6, angle=0, id, name, ctx, canvas, roster) { // Standard FOV = 150 degrees OR 5π/6
        console.log("A new agent called " + name + " has been created");
        super(id, name, ENTITY_TYPES.AGENT);
        this.isSpecial = isSpecial;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.hasMotion = true;
        this.hasHeading = true;
        this.dx = dx;
        this.dy = dy;
        // 25.2.17 FIX: ANGLE INDEPENDENT OF dy & dx
        this.angle = angle; // We have now set the angle to be independent of dy & dx
        this.steeringAngle = angle;
        this.colorHex = colorHex;  // Default color
        this.originalColor = colorHex; // Store original color: won't change, java
        this.fovRadius = fovRadius; // FOV range of detection
        this.fovAngle = fovAngle;
        // Initialize an empty array to hold detected ENTITIES (6/28/2026)
        this.detectedEntities = [];
        // The canvas monitor reads the latest calculated Behavior data directly.
        this.activeBehaviorGroups = {};
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
        const randomIndex = Math.floor(Math.random() * possibleColor.length);
        this.colorHex = possibleColor[randomIndex];
    }

    // Method to draw the circle <-- not circle, AGENT
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
        const x = this.x + offset.x;
        const y = this.y + offset.y;

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
        const canvasWidth = getCanvasLogicalWidth(this.canvas);
        const canvasHeight = getCanvasLogicalHeight(this.canvas);

        if (this.x + range > canvasWidth) {
            horizontalOffset = -canvasWidth;
        } else if (this.x - range < 0) {
            horizontalOffset = canvasWidth;
        }

        if (this.y + range > canvasHeight) {
            verticalOffset = -canvasHeight;
        } else if (this.y - range < 0) {
            verticalOffset = canvasHeight;
        }

        const offsets = [];
        if (horizontalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, 0));
        if (verticalOffset !== 0) offsets.push(new fovOffset(0, verticalOffset));
        if (horizontalOffset !== 0 && verticalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, verticalOffset));
        return offsets;
    }

    // Phase 1: move, warp, and draw — all agents run this before any behavior is applied
    move(maxSpeed = null) {
        this.x += this.dx;
        this.y += this.dy;
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
    behave(allEntities, behaviorGroups, maxSpeed = null, maxAngle = null, smoothingFactor = 0.15) {
        this.detectEntities(allEntities);
        let weightedDirectionY = 0, weightedDirectionX = 0;
        const speedCap = parseNumberCap(maxSpeed);
        const angleCap = parseNumberCap(maxAngle) * Math.PI / 180;
        const smoothing = Math.min(
            Math.max(parseNumberOrDefault(smoothingFactor, 0.15), 0.05),
            1
        );

        // Runtime Groups
        const activeBehaviorGroups = {}; // Behaviors whose Activation Weight is valid for this frame.

        // Calculate Raw Weight (pre-normalization) for ALL behaviors (regardless of their behaviorGroup)
        for (const groupName in behaviorGroups) {
            const behaviors = behaviorGroups[groupName];

            activeBehaviorGroups[groupName] = []; // Initialize one active list for each Behavior Group.

            for (const behavior of behaviors) {
                if (behavior.enabled !== true) continue;

                // Get the value being checked based on condition 
                // (source -> value to check -> use filters -> average if needed)
                const activationValue =
                    getActivationInputValue(
                        behavior.activation,
                        this,
                        this.detectedEntities
                    );

                // Calculate the raw Activation Weight.
                const rawActivationWeight =
                    calculateActivationWeight(
                        behavior.activation,
                        activationValue
                    );

                if (!Number.isFinite(rawActivationWeight) || rawActivationWeight <= 0) continue;
                
                // Calculation actionValue once, not again below.
                let actionValue = null;
                if (behavior.action === REFERENCE_TYPES.NEIGHBOR_REFERENCE) {
                    actionValue = calculateBehaviorValue(
                        behavior,
                        this,
                        this.detectedEntities
                    );

                    if (actionValue === null) continue;
                }

                // Store the Behavior with its raw Activation Weight.
                activeBehaviorGroups[groupName].push({
                    behavior,
                    rawActivationWeight,
                    actionValue
                });
            }
        }

        // Normalize the weight for each runtime group.
        for (const groupName in activeBehaviorGroups) {
            const activeBehaviorGroup = activeBehaviorGroups[groupName];

            for (const activeBehavior of activeBehaviorGroup) {
                activeBehavior.normalizedActivationWeight = normalizeWeight(
                    activeBehavior.rawActivationWeight,
                    activeBehaviorGroup
                );
            }
        }

        // Expose this frame's actual calculation objects to the canvas monitor.
        this.activeBehaviorGroups = activeBehaviorGroups;

        // ---- HEADING DIRECTION GROUP ----
        // Heading Direction uses a weighted circular mean because angles wrap at 360 degrees.
        const activeHeadingBehaviors = activeBehaviorGroups[BEHAVIOR_GROUPS.HEADING_DIRECTION];

        for (const activeBehavior of activeHeadingBehaviors) {
            const behavior = activeBehavior.behavior;
            const offset = parseNumberOrDefault(behavior.offset, 0);
            let desiredAngle = null;

            if (behavior.action === REFERENCE_TYPES.SELF_REFERENCE) {
                desiredAngle = this.angle + offset * Math.PI / 180;
            } else {
                desiredAngle = activeBehavior.actionValue + offset * Math.PI / 180;
            }

            if (desiredAngle === null) continue;

            weightedDirectionY += Math.sin(desiredAngle) * activeBehavior.normalizedActivationWeight;
            weightedDirectionX += Math.cos(desiredAngle) * activeBehavior.normalizedActivationWeight;
        }

        if (activeHeadingBehaviors.length > 0 && (weightedDirectionY !== 0 || weightedDirectionX !== 0)) {
            const desiredAngle = Math.atan2(weightedDirectionY, weightedDirectionX);
            // Smooth the behavior target first, then respect the turn-angle cap.
            this.steeringAngle = smoothTowardAngle(
                this.steeringAngle,
                desiredAngle,
                smoothing
            );
            this.angle = turnTowardAngle(this.angle, this.steeringAngle, angleCap);
        } else {
            // Do not carry an inactive Heading Behavior's target into a later frame.
            this.steeringAngle = this.angle;
        }

        // ---- SPEED BEHAVIOR GROUP ----
        // Speed uses a weighted arithmetic mean within the Speed Group.
        const activeSpeedBehaviors = activeBehaviorGroups[BEHAVIOR_GROUPS.SPEED]; // returns all valid speed behaviors
        const currentSpeed = Math.min(Math.sqrt(this.dx ** 2 + this.dy ** 2), speedCap);
        let finalSpeed = currentSpeed;
        let weightedSpeedSum = 0;

        for (const activeBehavior of activeSpeedBehaviors) {
            const behavior = activeBehavior.behavior; // extract the behavior
            const offset = parseNumberOrDefault(behavior.offset, 0); // grab the offset from ACTION
            let desiredSpeed = null;

            if (behavior.action === REFERENCE_TYPES.SELF_REFERENCE) { // if self-referenced action, don't enter weight calculation.
                desiredSpeed = currentSpeed + offset;
            } else {
                desiredSpeed = activeBehavior.actionValue + offset;
            }

            if (desiredSpeed === null) continue;

            desiredSpeed = Math.min(Math.max(0, desiredSpeed), speedCap);
            weightedSpeedSum += desiredSpeed * activeBehavior.normalizedActivationWeight;
        }

        // Use the weighted sum because weights were already normalized above.
        if (activeSpeedBehaviors.length > 0) finalSpeed = weightedSpeedSum;

        // ------
        // Apply the final Heading and Speed together so one Group does not overwrite the other.
        this.dx = Math.cos(this.angle) * finalSpeed;
        this.dy = Math.sin(this.angle) * finalSpeed;
    }

    // Wrap to the other side of the canvas if out of bounds
    warpAgent() {
        const canvasWidth = getCanvasLogicalWidth(this.canvas);
        const canvasHeight = getCanvasLogicalHeight(this.canvas);

        if (this.x >= canvasWidth) {
            this.x -= canvasWidth;
        } else if (this.x < 0) {
            this.x += canvasWidth;
        }

        if (this.y >= canvasHeight) {
            this.y -= canvasHeight;
        } else if (this.y < 0) {
            this.y += canvasHeight;
        }
    }

    // New: detect all entities specified by UI
    detectEntities(entities) {
        const currentlyDetected = [];

        // Loop through all entities to check if they are within FOV
        entities.forEach(entity => {
            const entityCenter = getEntityCenterPoint(entity);
            if (entity !== this && entityCenter) {
                const { diffX, diffY } = getShortestOffset(this, entityCenter, this.canvas);

                const distanceBetweenEntities = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distanceBetweenEntities <= this.fovRadius + entity.radius) {
                    const detectionPoints = getEntityDetectionPoints(this, entity);

                    // Use all detection points for the FOV angle check.
                    // The center/centroid is still used above as a cheap broad-phase distance check.
                    const isVisible = detectionPoints.some((point) => {
                        const { diffX: refDiffX, diffY: refDiffY } =
                            getShortestOffset(this, point, this.canvas);

                        // A polygon's bounding radius is only a broad-phase check.
                        // Its closest real edge must also be inside the FOV radius.
                        if (
                            entity.entityType === ENTITY_TYPES.OBSTACLE &&
                            entity.shapeType === OBSTACLE_SHAPE_TYPES.POLYGON &&
                            Math.hypot(refDiffX, refDiffY) > this.fovRadius
                        ) {
                            return false;
                        }

                        const targetAngle = Math.atan2(refDiffY, refDiffX);
                        const currentAgentAngle = this.angle;

                        let angleDifference = Math.abs(currentAgentAngle - targetAngle);
                        if (angleDifference > Math.PI) {
                            angleDifference = (2 * Math.PI) - angleDifference;
                        }

                        return angleDifference <= this.fovAngle / 2;
                    });

                    if (isVisible) {
                        currentlyDetected.push(entity);
                        // Only change to red if this entity wasn't detected in the previous update
                        // if (!this.detectedEntities.includes(entity)) {
                        //     entity.colorHex = '#FF0000';
                        // }
                    }
                }
            }
        });

        // For any entity that was previously detected but is no longer in the current list,
        // reset its color to original.
        this.detectedEntities.forEach(entity => {
            if (!currentlyDetected.includes(entity)) {
                // entity.colorHex = entity.originalColor; // Line changing color to red is in behavior.js
            }
        });

        // Update the detectedEntities list for the next update cycle.
        this.detectedEntities = currentlyDetected;
    }

}
