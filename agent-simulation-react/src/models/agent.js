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
import { TARGET_PROPERTIES, REFERENCE_TYPES, ENTITY_TYPES, SHAPE_TYPES } from "../utils/constants.js";
import { getCanvasLogicalHeight, getCanvasLogicalWidth, parseNumberCap, parseNumberOrDefault } from "../utils/utilities.js";
import { BEHAVIOR_GROUPS } from "../utils/behaviorGroups.js";
import { CircleShape } from "./shapes.js";

export class Agent extends Entity{
    constructor(isSpecial, x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = 5 * Math.PI / 6, angle=0, id, name, canvas, roster) { // Standard FOV = 150 degrees OR 5π/6
        console.log("A new agent called " + name + " has been created");
        const rotation = Math.atan2(Math.sin(angle), Math.cos(angle));
        super(id, name, ENTITY_TYPES.AGENT, { x, y }, rotation, { x: dx, y: dy }, [new CircleShape(radius)]);
        this.isSpecial = isSpecial;
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
        // Canvas dimensions are used for wrapped drawing and FOV distance calculations.
        this.canvas = canvas;
        this.roster = roster;
        // Add this agent to the roster if provided
        if (roster != null) roster.push(this); // Add this agent to the roster if provided
    }   

    draw(ctx) {
        // showFOV is attached by Simulation.jsx as a global display setting.
        const shouldDrawFOV = this.isSpecial && this.showFOV !== false;
        const canvasWidth = getCanvasLogicalWidth(this.canvas);
        const canvasHeight = getCanvasLogicalHeight(this.canvas);
        const offsets = [
            ...this.getVirtualOffsets(
                canvasWidth,
                canvasHeight,
                shouldDrawFOV ? this.fovRadius : 0
            ),
            { x: 0, y: 0 },
        ];

        offsets.forEach((offset) => {
            const transform = {
                position: {
                    x: this.transform.position.x + offset.x,
                    y: this.transform.position.y + offset.y,
                },
                rotation: this.transform.rotation,
            };

            if (shouldDrawFOV) {
                ctx.beginPath();
                ctx.moveTo(transform.position.x, transform.position.y);
                ctx.arc(
                    transform.position.x,
                    transform.position.y,
                    this.fovRadius,
                    transform.rotation - this.fovAngle / 2,
                    transform.rotation + this.fovAngle / 2
                );
                ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
                ctx.fill();
                ctx.closePath();
            }

            super.draw(ctx, transform, { fill: null, stroke: this.colorHex, lineWidth: 2 });

            // Draw movement direction segment.
            const segmentLength = this.getBoundingRadius() * 2;
            ctx.beginPath();
            ctx.moveTo(transform.position.x, transform.position.y);
            ctx.lineTo(
                transform.position.x + Math.cos(transform.rotation) * segmentLength,
                transform.position.y + Math.sin(transform.rotation) * segmentLength
            );
            ctx.stroke();
            ctx.closePath();
        });
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

    // Detect runtime Entities inside this Agent's field of view.
    detectEntities(entities) {
        const currentlyDetected = [];

        // Loop through all entities to check if they are within FOV
        entities.forEach(entity => {
            const entityCenter = getEntityCenterPoint(entity);
            if (entity !== this && entityCenter) {
                const { diffX, diffY } = getShortestOffset(this.transform.position, entityCenter, this.canvas);

                const distanceBetweenEntities = Math.sqrt(diffX * diffX + diffY * diffY);

                if (distanceBetweenEntities <= this.fovRadius + entity.getBoundingRadius()) {
                    const detectionPoints = getEntityDetectionPoints(this, entity);

                    // Use all detection points for the FOV angle check.
                    // The center/centroid is still used above as a cheap broad-phase distance check.
                    const isVisible = detectionPoints.some((point) => {
                        const { diffX: refDiffX, diffY: refDiffY } =
                            getShortestOffset(this.transform.position, point, this.canvas);

                        // A polygon's bounding radius is only a broad-phase check.
                        // Its closest real edge must also be inside the FOV radius.
                        if (
                            entity.typeId === ENTITY_TYPES.OBSTACLE &&
                            entity.shapes.some((shape) => shape.type === SHAPE_TYPES.POLYGON) &&
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
                    }
                }
            }
        });

        // Update the detectedEntities list for the next update cycle.
        this.runtimeState.detectedEntities = currentlyDetected;
    }

}
