class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    // Method to update the position by adding dx and dy
    add(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}

class Offset {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Agent {
    constructor(drawFOV, x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = 5 * Math.PI / 6, angle=0, id) { // Standard FOV = 150 degrees OR 5π/6
        // Instead of separate x and y, we now use a Position() class
        this.drawFOV = drawFOV;
        this.position = new Position(x, y);
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        // 2.17 FIX: ANGLE INDEPENDENT OF dy & dx
        this.angle = angle; // We have now set the angle to be independent of dy & dx
        this.colorHex = colorHex;  // Default color
        this.originalColor = colorHex; // Store original color: won't change, final in java
        this.fovRadius = fovRadius; // FOV range of detection
        this.fovAngle = fovAngle; 
        // Initialize an empty array to hold detected agents
        this.detectedAgents = [];
        this.id = id;
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
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.colorHex;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Draw movement direction segment
        const angle = this.angle;
        const segmentLength = this.radius * 2

        const endX = this.position.x + Math.cos(angle) * segmentLength;
        const endY = this.position.y + Math.sin(angle) * segmentLength;

        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();

        if (this.drawFOV)
            this.drawFOVCones(); // Draw FOV
    }

    // Method to update the position of the circle
    updatePosition() {
        // FIX: Updated to use the Circle's dx and dy, not this.position.dx and this.position.dy.
        this.position.add(this.dx, this.dy); 
        this.warpAgent();
        if (this.drawFOV) this.detectAgents(agents)
        this.draw();
    }

    // Method to draw the FOV Cone
    drawFOVCones() {
        // First, draw the virtual FOV if needed.
        let horizontalOffset = 0, verticalOffset = 0;

        // Horizontal
        if (this.position.x + (this.radius + this.fovRadius) > canvas.width) {
            // The FOV is extending past the right edge;
            // virtual copy should appear on the left.
            horizontalOffset = -canvas.width - 2 * this.radius; // Tweaked about this a little bit, now has a smooth transition.
        } else if (this.position.x - (this.radius + this.fovRadius) < 0) {
            // The FOV is extending past the left edge;
            // virtual copy should appear on the right.
            horizontalOffset = canvas.width + 2 * this.radius;
        }

        // Vertical
        if (this.position.y + this.radius + this.fovRadius > canvas.height) {
            verticalOffset = -canvas.height - 2 * this.radius; // virtual copy should appear at the top
        } else if (this.position.y - (this.radius + this.fovRadius) < 0) {
            verticalOffset = canvas.height + 2 * this.radius; // virtual copy should appear at the bottom.
        }
        
        // Debug step, allows me to see the offset value in real time. This is no longer needed.
        // console.log(horizontalOffset, verticalOffset);

        // Check offset in both directions.
        if (horizontalOffset !== 0) {
            // Draw the virtual FOV first.
            this.drawFOVAtOffset(new Offset(horizontalOffset, 0)); // Left or Right copy
        }
        if (verticalOffset !== 0) {
            this.drawFOVAtOffset(new Offset(0, verticalOffset)); // Top or Bottom copy
        }
        if (horizontalOffset !== 0 && verticalOffset !== 0) {
            this.drawFOVAtOffset(new Offset(horizontalOffset, verticalOffset)); // Diagonal copy
        }
        
        // Then draw the real FOV on top so it overwrites any overlapping parts.
        this.drawFOVAtOffset(new Offset(0, 0));
    }

    // Wrap to the other side of the canvas if out of bounds
    warpAgent() {
        if (this.position.x - this.radius >= canvas.width) { 
            this.position.x = -this.radius // Used to be -this.radius. Here is where the lag is fixed. If in the future we have to fix something, come back here.
        } else if (this.position.x + this.radius <= 0) { 
            this.position.x = canvas.width + this.radius;
        }

        if (this.position.y - this.radius >= canvas.height) { 
            this.position.y = -this.radius; 
        } else if (this.position.y + this.radius <= 0) { 
            this.position.y = canvas.height + this.radius;
        }
    }

    drawFOVAtOffset(offset) {
        // Calculate the new position where the FOV should be drawn. These are based on agent's position, plus an "offset"
        // ChatGPT debugged this
        // Calculate the new position where the FOV should be drawn.
        const x = this.position.x + offset.x;
        const y = this.position.y + offset.y;

        // Get movement direction
        let angle = this.angle;
        let startAngle = angle - this.fovAngle / 2; 
        let endAngle = angle + this.fovAngle / 2; 

        ctx.beginPath();
        ctx.moveTo(x, y); // Use offset-adjusted position
        ctx.arc(x, y, this.fovRadius, startAngle, endAngle);
        ctx.fillStyle = "rgba(0, 0, 255, 0.2)";
        ctx.fill();
        ctx.closePath();
    }

    // Detection system to identify agents inside FOV
    // Written by ChatGPT, will make my own version.
    detectAgents(agents) {
        let currentlyDetected = [];
        
        // Loop through all agents to check if they are within FOV
        agents.forEach(agent => {
            if (agent !== this) { // Don't detect self
                let diffX = agent.position.x - this.position.x;
                let diffY = agent.position.y - this.position.y;
    
                // Adjust for wrapping on the x-axis
                if (diffX > canvas.width / 2) {
                    diffX -= canvas.width;
                } else if (diffX < -canvas.width / 2) {
                    diffX += canvas.width;
                }
                
                // Adjust for wrapping on the y-axis
                if (diffY > canvas.height / 2) {
                    diffY -= canvas.height;
                } else if (diffY < -canvas.height / 2) {
                    diffY += canvas.height;
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
        
        // Update the detectedAgents list for the next update cycle.
        this.detectedAgents = currentlyDetected;
    }
    
    // for simulation - what info do we report?
    reportInformation() {
        return {
            x: this.position.x,
            y: this.position.y,
            dx: this.dx,
            dy: this.dy,
            angle: this.angle,
            fovAngle: this.fovAngle,
            fovRadius: this.fovRadius,
            colorHex: this.colorHex
        }
    }
}