class Circle {
    constructor(x, y, radius, dx, dy, colorHex = '#000000') {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dx = dx;
    this.dy = dy;
    this.colorHex = colorHex;
    }

    // Method to draw the circle
    draw() {
        // Use the global 'ctx' and 'canvas' variables defined later in the HTML file.
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.colorHex;
        ctx.fill();
        ctx.closePath();
    }

    // Method to update the position of the circle
    updatePosition() {
        this.x += this.dx;
        this.y += this.dy;
        this.bounceOffTheWall();
        this.draw();
    }

    // Method to bounce the circle off the walls
    bounceOffTheWall() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.dy = -this.dy;
        }
    }
}