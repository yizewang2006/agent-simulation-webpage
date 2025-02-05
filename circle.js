class Circle {
    constructor(x, y, radius, dx, dy, colorHex = '#000000', fovRadius = 100, fovAngle = Math.PI / 3) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.colorHex = colorHex;
        this.fovRadius = fovRadius; // FOV detection range (distance)
        this.fovAngle = fovAngle;   // Angle of FOV cone (radians)
    }

    // Method to draw the circle
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorHex;
        ctx.fill();
        ctx.closePath();

        this.drawFOVCone(); // Draw FOV
    }

    // Method to update the position of the circle
    updatePosition() {
        this.x += this.dx;
        this.y += this.dy;
        this.warpIfNeeded();
        this.draw();
    }

    // Method to draw the FOV Cone
    drawFOVCone() {
        let angle = Math.atan2(this.dy, this.dx); // Get movement direction
        let startAngle = angle - this.fovAngle / 2; // Start angle: left of that circle
        let endAngle = angle + this.fovAngle / 2; // End angle: 

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.arc(this.x, this.y, this.fovRadius, startAngle, endAngle);
        ctx.fillStyle = "rgba(0, 0, 255, 0.2)"; // Light blue transparent FOV
        ctx.fill();
        ctx.closePath();
    }

    // Wrap to the other side of the canvas if out of bounds
    warpIfNeeded() {
    if (this.x - this.radius > canvas.width) { 
        this.x = -this.radius; 
    } else if (this.x + this.radius < 0) { 
        this.x = canvas.width + this.radius;
    }

    if (this.y - this.radius > canvas.height) { 
        this.y = -this.radius; 
    } else if (this.y + this.radius < 0) { 
        this.y = canvas.height + this.radius;
    }
}
}
