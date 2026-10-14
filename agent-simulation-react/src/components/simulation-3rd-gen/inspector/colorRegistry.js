const DEFAULT_COLORS = [
  { name: "Red", value: "#FF0000" },
  { name: "Green", value: "#00FF00" },
  { name: "Blue", value: "#0000FF" },
  { name: "Black", value: "#000000" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Orange", value: "#FFA500" },
  { name: "Purple", value: "#800080" },
  { name: "Brown", value: "#A52A2A" },
];

let registeredColors = DEFAULT_COLORS;
const listeners = new Set();

export function subscribeToColorRegistry(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRegisteredColors() {
  return registeredColors;
}

export function registerColor(color) {
  const normalizedColor = color.toUpperCase();
  if (registeredColors.some((option) => option.value === normalizedColor)) return;

  registeredColors = [
    ...registeredColors,
    { name: normalizedColor, value: normalizedColor },
  ];
  listeners.forEach((listener) => listener());
}
