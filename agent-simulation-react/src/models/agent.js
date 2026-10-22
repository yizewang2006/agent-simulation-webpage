import { Entity } from "./entity.js";
import { calculateBehaviorValue,
    calculateActivationWeight,
    getActivationInputValue,
    getEntityCenterPoint,
    getEntityDetectionPoints,
    getShortestOffset,
    smoothTowardAngle,
    turnTowardAngle,
    normalizeWeight } from "./behavior.js";
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
        const rotation = Math.atan2(Math.sin(angle), Math.cos(angle));
        super(id, name, ENTITY_TYPES.AGENT, { x, y }, rotation, { x: dx, y: dy });
        this.isSpecial = isSpecial;
        this.radius = radius;
        this.hasMotion = true;
        this.hasHeading = true;
        // 25.2.17 FIX: ANGLE INDEPENDENT OF dy & dx
        this.runtimeState.steeringRotation = rotation; // We have now set the angle to be independent of dy & dx
        this.colorHex = colorHex;  // Default color
        this.originalColor = colorHex; // Store original color: won't change, java
        this.fovRadius = fovRadius; // FOV range of detection
        this.fovAngle = fovAngle;
        // Initialize an empty array to hold detected ENTITIES (6/28/2026)
        this.runtimeState.detectedEntities = [];
        // The canvas monitor reads the latest calculated Behavior data directly.
        this.runtimeState.activeBehaviorGroups = {};
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
        const x = this.transform.position.x + offset.x;
        const y = this.transform.position.y + offset.y;

        if (drawFOV) {
            const startAngle = this.transform.rotation - this.fovAngle / 2;
            const endAngle = this.transform.rotation + this.fovAngle / 2;

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
        const angle = this.transform.rotation;
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

        if (this.transform.position.x + range > canvasWidth) {
            horizontalOffset = -canvasWidth;
        } else if (this.transform.position.x - range < 0) {
            horizontalOffset = canvasWidth;
        }

        if (this.transform.position.y + range > canvasHeight) {
            verticalOffset = -canvasHeight;
        } else if (this.transform.position.y - range < 0) {
            verticalOffset = canvasHeight;
        }

        const offsets = [];
        if (horizontalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, 0));
        if (verticalOffset !== 0) offsets.push(new fovOffset(0, verticalOffset));
        if (horizontalOffset !== 0 && verticalOffset !== 0) offsets.push(new fovOffset(horizontalOffset, verticalOffset));
        return offsets;
    }

    // Phase 1: move and warp — rendering is handled separately by the simulation.
    move(maxSpeed = null) {
        this.transform.position.x += this.velocity.x;
        this.transform.position.y += this.velocity.y;
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            this.transform.rotation = Math.atan2(this.velocity.y, this.velocity.x);
        }
        if (maxSpeed !== null) {
            const speedCap = parseNumberCap(maxSpeed);
            const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (currentSpeed > speedCap) {
                const scale = speedCap / currentSpeed;
                this.velocity.x *= scale;
                this.velocity.y *= scale;
            }
        }
        this.warpAgent();
    }

    // Phase 2: detect and apply behaviors using consistent post-move positions
    calculateDecision(allEntities, behaviorGroups, maxSpeed = null, maxAngle = null, smoothingFactor = 0.15) {
        this.detectEntities(allEntities);
        let weightedDirectionY = 0, weightedDirectionX = 0;
        let finalAngle = this.transform.rotation;
        let finalSteeringAngle = this.runtimeState.steeringRotation;
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
                        this.runtimeState.detectedEntities
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
                        this.runtimeState.detectedEntities
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

        // ---- HEADING DIRECTION GROUP ----
        // Heading Direction uses a weighted circular mean because angles wrap at 360 degrees.
        const activeHeadingBehaviors = activeBehaviorGroups[BEHAVIOR_GROUPS.HEADING_DIRECTION];

        for (const activeBehavior of activeHeadingBehaviors) {
            const behavior = activeBehavior.behavior;
            const offset = parseNumberOrDefault(behavior.offset, 0);
            let desiredAngle = null;

            if (behavior.action === REFERENCE_TYPES.SELF_REFERENCE) {
                desiredAngle = this.transform.rotation + offset * Math.PI / 180;
            } else {
                desiredAngle = activeBehavior.actionValue + offset * Math.PI / 180;
            }

            if (desiredAngle === null) continue;

            activeBehavior.desiredAngle = desiredAngle;
            weightedDirectionY += Math.sin(desiredAngle) * activeBehavior.normalizedActivationWeight;
            weightedDirectionX += Math.cos(desiredAngle) * activeBehavior.normalizedActivationWeight;
        }

        if (activeHeadingBehaviors.length > 0 && Math.hypot(weightedDirectionY, weightedDirectionX) >= 1e-12) {
            const desiredAngle = Math.atan2(weightedDirectionY, weightedDirectionX);
            // Smooth the behavior target first, then respect the turn-angle cap.
            finalSteeringAngle = smoothTowardAngle(
                this.runtimeState.steeringRotation,
                desiredAngle,
                smoothing
            );
            finalAngle = turnTowardAngle(this.transform.rotation, finalSteeringAngle, angleCap);
        } else {
            // Do not carry an inactive Heading Behavior's target into a later frame.
            finalSteeringAngle = this.transform.rotation;
        }

        // ---- SPEED BEHAVIOR GROUP ----
        // Speed uses a weighted arithmetic mean within the Speed Group.
        const activeSpeedBehaviors = activeBehaviorGroups[BEHAVIOR_GROUPS.SPEED]; // returns all valid speed behaviors
        const currentSpeed = Math.min(Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2), speedCap);
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
            activeBehavior.desiredSpeed = desiredSpeed;
            activeBehavior.speedChange = desiredSpeed - currentSpeed;
            weightedSpeedSum += desiredSpeed * activeBehavior.normalizedActivationWeight;
        }

        // Use the weighted sum because weights were already normalized above.
        if (activeSpeedBehaviors.length > 0) finalSpeed = weightedSpeedSum;

        return {
            activeBehaviorGroups,
            finalAngle,
            finalSpeed,
            finalSteeringAngle,
        };
    }

    applyDecision(decision) {
        // Expose this frame's actual calculation objects to the canvas monitor.
        this.runtimeState.activeBehaviorGroups = decision.activeBehaviorGroups;
        this.runtimeState.steeringRotation = decision.finalSteeringAngle;
        this.transform.rotation = decision.finalAngle;

        // ------
        // Apply the final Heading and Speed together so one Group does not overwrite the other.
        this.velocity.x = Math.cos(this.transform.rotation) * decision.finalSpeed;
        this.velocity.y = Math.sin(this.transform.rotation) * decision.finalSpeed;
    }

    // Wrap to the other side of the canvas if out of bounds
    warpAgent() {
        const canvasWidth = getCanvasLogicalWidth(this.canvas);
        const canvasHeight = getCanvasLogicalHeight(this.canvas);

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

    // New: detect all entities specified by UI
    detectEntities(entities) {
        const currentlyDetected = [];

        // Loop through all entities to check if they are within FOV
        entities.forEach(entity => {
            const entityCenter = getEntityCenterPoint(entity);
            if (entity !== this && entityCenter) {
                const { diffX, diffY } = getShortestOffset(this.transform.position, entityCenter, this.canvas);

                const distanceBetweenEntities = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distanceBetweenEntities <= this.fovRadius + entity.radius) {
                    const detectionPoints = getEntityDetectionPoints(this, entity);

                    // Use all detection points for the FOV angle check.
                    // The center/centroid is still used above as a cheap broad-phase distance check.
                    const isVisible = detectionPoints.some((point) => {
                        const { diffX: refDiffX, diffY: refDiffY } =
                            getShortestOffset(this.transform.position, point, this.canvas);

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
                        const currentAgentAngle = this.transform.rotation;

                        let angleDifference = Math.abs(currentAgentAngle - targetAngle);
                        if (angleDifference > Math.PI) {
                            angleDifference = (2 * Math.PI) - angleDifference;
                        }

                        return angleDifference <= this.fovAngle / 2;
                    });

                    if (isVisible) {
                        currentlyDetected.push(entity);
                        // Only change to red if this entity wasn't detected in the previous update
                        // if (!this.runtimeState.detectedEntities.includes(entity)) {
                        //     entity.colorHex = '#FF0000';
                        // }
                    }
                }
            }
        });

        // For any entity that was previously detected but is no longer in the current list,
        // reset its color to original.
        this.runtimeState.detectedEntities.forEach(entity => {
            if (!currentlyDetected.includes(entity)) {
                // entity.colorHex = entity.originalColor; // Line changing color to red is in behavior.js
            }
        });

        // Update the detectedEntities list for the next update cycle.
        this.runtimeState.detectedEntities = currentlyDetected;
    }

}
