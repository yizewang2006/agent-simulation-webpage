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

class Circle {
    constructor(x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = Math.PI / 3) {
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
        // This went wrong at the first time, where I accidentally used this.position.x and this.position.y
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
}