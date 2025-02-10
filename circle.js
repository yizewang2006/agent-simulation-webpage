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

class Circle {
    constructor(x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = 5 * Math.PI / 6) { // Standard FOV = 150 degrees OR 5π/6
        // Instead of separate x and y, we now use a Position() class
        this.position = new Position(x, y);
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.colorHex = colorHex;
        this.fovRadius = fovRadius; // FOV detection range (distance)
        this.fovAngle = fovAngle; 
    }

    // Method to draw the circle
    draw() {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorHex;
        ctx.fill();
        ctx.closePath();

        this.drawFOVCone(); // Draw FOV
    }

    // Method to update the position of the circle
    updatePosition() {
        // FIX: Updated to use the Circle's dx and dy, not this.position.dx and this.position.dy.
        this.position.add(this.dx, this.dy);
        this.warpIfNeeded();
        this.draw();
    }

    // Method to draw the FOV Cone
    drawFOVCone() {
        /*
        this.drawFOVAtOffset(new Offset(0,0)); // Real Agent's FOV, with NO offset.

        // Horizontal Boundary
        let horizontalOffset = 250;

        // Two conditions: if the position of the agent is at the left/right border, trigger the "warp function", and virtual agents will draw their FOVs
        // I used ChatGPT to debug my code, where it didn't work.

        
        if (this.position.x + this.radius + this.fovRadius > canvas.width) {
            // Compute how far the FOV extends past the right edge.
            const overlap = (this.position.x + this.radius + this.fovRadius) - canvas.width;
            // Instead of shifting by the full canvas width, we shift by just enough
            // so that the FOV's left-most drawn point on the virtual copy aligns with the edge.
            horizontalOffset = -canvas.width + overlap;
        } else if (this.position.x - (this.radius + this.fovRadius) < 0) {
            const overlap = (this.radius + this.fovRadius) - this.position.x;
            horizontalOffset = canvas.width - overlap;
        }
        

        if (horizontalOffset != 0) {
            this.drawFOVAtOffset(new Offset(horizontalOffset, 0));
        }
        */

        // First, draw the virtual FOV if needed.
        let horizontalOffset = 0;
        
        if (this.position.x + this.radius + this.fovRadius > canvas.width) {
            // The FOV is extending past the right edge;
            // virtual copy should appear on the left.
            horizontalOffset = -canvas.width;
        } else if (this.position.x - (this.radius + this.fovRadius) < 0) {
            // The FOV is extending past the left edge;
            // virtual copy should appear on the right.
            horizontalOffset = canvas.width;
        }
        
        if (horizontalOffset !== 0) {
            // Draw the virtual FOV first.
            this.drawFOVAtOffset(new Offset(horizontalOffset, 0));
        }
        
        // Then draw the real FOV on top so it overwrites any overlapping parts.
        this.drawFOVAtOffset(new Offset(0, 0));
    }

    // Wrap to the other side of the canvas if out of bounds
    warpIfNeeded() {
        if (this.position.x - this.radius > canvas.width) { 
            this.position.x = -this.radius; 
        } else if (this.position.x + this.radius < 0) { 
            this.position.x = canvas.width + this.radius;
        }

        if (this.position.y - this.radius > canvas.height) { 
            this.position.y = -this.radius; 
        } else if (this.position.y + this.radius < 0) { 
            this.position.y = canvas.height + this.radius;
        }
    }

    drawFOVAtOffset(offset) {
        // Calculate the new position where the FOV should be drawn. These are based on agent's position, plus an "offset"
        const x = this.position.x + offset.x;
        const y = this.position.y + offset.y;

        // This went wrong at the first time, where I accidentally used this.position.x and this.position.y. 
        // This part was originally from drawFOVCone() method. 
        let angle = Math.atan2(this.dy, this.dx); // Get movement direction
        let startAngle = angle - this.fovAngle / 2; // Start angle: left of that circle
        let endAngle = angle + this.fovAngle / 2; // End angle: right of that circle

        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.arc(this.position.x, this.position.y, this.fovRadius, startAngle, endAngle);
        ctx.fillStyle = "rgba(0, 0, 255, 0.2)"; // Light blue transparent FOV
        ctx.fill();
        ctx.closePath();
    }
}