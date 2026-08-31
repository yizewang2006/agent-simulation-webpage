/** Default Figure 1 scenario — embedded so the page works without a server. */
window.DEFAULT_SCENARIO = {
  agent: { id: "A", x: 400, y: 300, radius: 5, heading: 0 },
  fov_distance: 120,
  heading_interval: 15,
  merge_gap: 2,
  neighbors: {
    agents: [
      { id: "A1", x: 500, y: 250, radius: 5 },
      { id: "A2", x: 530, y: 295, radius: 5 },
      { id: "A3", x: 505, y: 340, radius: 5 },
      { id: "A4", x: 475, y: 310, radius: 5 },
    ],
    circle_obstacles: [{ id: "O1", x: 310, y: 200, radius: 18 }],
    rectangle_walls: [
      { id: "W1", x: 250, y: 420, width: 90, height: 12 },
      { id: "W2", x: 220, y: 470, width: 120, height: 12 },
    ],
  },
};
