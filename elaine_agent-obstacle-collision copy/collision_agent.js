import { Entity } from "./entity.js";

export class Agent extends Entity {
  constructor(x, y, radius, colorHex, id, ctx, canvas) {
    super(id);
    this.position = { x, y };
    this.radius = radius;
    this.colorHex = colorHex;
    this.originalColor = colorHex;
    this.ctx = ctx;
    this.canvas = canvas;
  }

  draw() {
    const { x, y } = this.position;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.colorHex;
    this.ctx.fill();
    this.ctx.strokeStyle = "#222";
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // ID Label
    this.ctx.fillStyle = "#000";
    this.ctx.font = "bold 12px Roboto, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(this.ID, x, y - this.radius - 10);
  }

  update() {
    this.draw();
  }
}