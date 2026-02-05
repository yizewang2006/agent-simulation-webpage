import { Entity } from "./entity.js";
import { Position } from "./behavior.js"

class fovOffset {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
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
        this.colorHex = colorHex;  // Default color
        this.originalColor = colorHex; // Store original color: won't change, final in java
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
        // Draw the circle itself and hollow.
        this.ctx.beginPath();
        this.ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = this.colorHex;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.closePath();

        // Draw movement direction segment
        const angle = this.angle;
        const segmentLength = this.radius * 2

        const endX = this.position.x + Math.cos(angle) * segmentLength;
        const endY = this.position.y + Math.sin(angle) * segmentLength;

        this.ctx.beginPath();
        this.ctx.moveTo(this.position.x, this.position.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        this.ctx.closePath();
        
        // New as of 9/23
        if (this.isSpecial) this.drawFOVCones(); // Draw FOV
    }

    // Method to update the position of the circle
    updatePosition(allAgents) {
        // FIX: Updated to use the Circle's dx and dy, not this.position.dx and this.position.dy.
        this.position.add(this.dx, this.dy);
        if (this.dx !== 0 || this.dy !== 0) {
            this.angle = Math.atan2(this.dy, this.dx);
        }
        this.warpAgent();
        this.detectAgents(allAgents); // New as of 9/23/25
        this.draw();
    }

    // Method to draw the FOV Cone
    drawFOVCones() {
        // First, draw the virtual FOV if needed.
        let horizontalOffset = 0, verticalOffset = 0;

        // Horizontal
        if (this.position.x + (this.radius + this.fovRadius) > this.canvas.width) {
            // The FOV is extending past the right edge;
            // virtual copy should appear on the left.
            horizontalOffset = -this.canvas.width - 2 * this.radius; // Tweaked about this a little bit, now has a smooth transition.
        } else if (this.position.x - (this.radius + this.fovRadius) < 0) {
            // The FOV is extending past the left edge;
            // virtual copy should appear on the right.
            horizontalOffset = this.canvas.width + 2 * this.radius;
        }

        // Vertical
        if (this.position.y + this.radius + this.fovRadius > this.canvas.height) {
            verticalOffset = -this.canvas.height - 2 * this.radius; // virtual copy should appear at the top
        } else if (this.position.y - (this.radius + this.fovRadius) < 0) {
            verticalOffset = this.canvas.height + 2 * this.radius; // virtual copy should appear at the bottom.
        }
        
        // Debug step, allows me to see the offset value in real time. This is no longer needed.
        // console.log(horizontalOffset, verticalOffset);

        // Check offset in both directions.
        if (horizontalOffset !== 0) {
            // Draw the virtual FOV first.
            this.drawFOVAtOffset(new fovOffset(horizontalOffset, 0)); // Left or Right copy
        }
        if (verticalOffset !== 0) {
            this.drawFOVAtOffset(new fovOffset(0, verticalOffset)); // Top or Bottom copy
        }
        if (horizontalOffset !== 0 && verticalOffset !== 0) {
            this.drawFOVAtOffset(new fovOffset(horizontalOffset, verticalOffset)); // Diagonal copy
        }
        
        // Then draw the real FOV on top so it overwrites any overlapping parts.
        this.drawFOVAtOffset(new fovOffset(0, 0));
    }

    // Wrap to the other side of the canvas if out of bounds
    warpAgent() {
        if (this.position.x - this.radius >= this.canvas.width) {
            this.position.x = -this.radius // Used to be -this.radius. Here is where the lag is fixed. If in the future we have to fix something, come back here.
        } else if (this.position.x + this.radius <= 0) {
            this.position.x = this.canvas.width + this.radius;
        }

        if (this.position.y - this.radius >= this.canvas.height) {
            this.position.y = -this.radius;
        } else if (this.position.y + this.radius <= 0) {
            this.position.y = this.canvas.height + this.radius;
        }
    }

    drawFOVAtOffset(offset) { // offset = FOV OFFSET
        // Calculate the new position where the FOV should be drawn. These are based on agent's position, plus an "offset"
        // Calculate the new position where the FOV should be drawn.
        const x = this.position.x + offset.x;
        const y = this.position.y + offset.y;

        // Get movement direction
        let angle = this.angle;
        let startAngle = angle - this.fovAngle / 2; 
        let endAngle = angle + this.fovAngle / 2; 

        this.ctx.beginPath();
        this.ctx.moveTo(x, y); // Use offset-adjusted position
        this.ctx.arc(x, y, this.fovRadius, startAngle, endAngle);
        this.ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
        this.ctx.fill();
        this.ctx.closePath();
    }

    // Detection system to identify agents inside FOV
    detectAgents(agents) {
        let currentlyDetected = [];
        
        // Loop through all agents to check if they are within FOV
        agents.forEach(agent => {
            if (agent !== this) { // Don't detect self
                let diffX = agent.position.x - this.position.x;
                let diffY = agent.position.y - this.position.y;
    
                // Adjust for wrapping on the x-axis
                if (diffX > this.canvas.width / 2) {
                    diffX -= this.canvas.width;
                } else if (diffX < -this.canvas.width / 2) {
                    diffX += this.canvas.width;
                }

                // Adjust for wrapping on the y-axis
                if (diffY > this.canvas.height / 2) {
                    diffY -= this.canvas.height;
                } else if (diffY < -this.canvas.height / 2) {
                    diffY += this.canvas.height;
                }
    
                let distanceBetweenAgents = Math.sqrt(diffX * diffX + diffY * diffY);
                
                // Check if within FOV radius
                if (distanceBetweenAgents <= this.fovRadius) {
                    let targetAngle = Math.atan2(diffY, diffX);
                    // 2.17 FIX: ANGLE INDEPENDENT OF dy & dx
                    let currentAgentAngle = this.angle;
                    
                    let angleDifference = Math.abs(currentAgentAngle - targetAngle);
                    if (angleDifference > Math.PI) angleDifference = (2 * Math.PI) - angleDifference;
                    
                    // Check if within FOV angle
                    if (angleDifference <= this.fovAngle / 2) {
                        currentlyDetected.push(agent);
                        // Only change to red if this agent wasn't detected in the previous update
                        if (!this.detectedAgents.includes(agent)) {
                            agent.colorHex = '#FF0000';
                        }
                    }
                }
            }
        });
        
        // For any agent that was previously detected but is no longer in the current list,
        // reset its color to original.
        this.detectedAgents.forEach(agent => {
            if (!currentlyDetected.includes(agent)) {
                agent.colorHex = agent.originalColor;
            }
        });

        if (currentlyDetected.length > 0) {
            let target = currentlyDetected.reduce((nearest, agent) => {
                let dx = agent.position.x - this.position.x;
                let dy = agent.position.y - this.position.y;
                let d = Math.sqrt(dx*dx + dy*dy);
                return d < nearest.dist ? {agent, dist: d} : nearest;
            }, {agent: currentlyDetected[0], dist: Infinity}).agent;

            this.follow(target);
            }
        
        // Update the detectedAgents list for the next update cycle.
        this.detectedAgents = currentlyDetected;
    }

    follow(target) {
        // AI initial solution!!!
        if (!target) return;

        // Calculate the vector from this agent to the target
        let diffX = target.position.x - this.position.x;
        let diffY = target.position.y - this.position.y;

        // Adjust for wrapping on canvas (so agents don't "see" across the wrong side)
        if (diffX > this.canvas.width / 2) diffX -= this.canvas.width;
        else if (diffX < -this.canvas.width / 2) diffX += this.canvas.width;

        if (diffY > this.canvas.height / 2) diffY -= this.canvas.height;
        else if (diffY < -this.canvas.height / 2) diffY += this.canvas.height;

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