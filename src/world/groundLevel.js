// Single source of truth for where the garden ground sits in world
// space. Imported by the ground mesh itself, the grass, the ground
// sprouts, and (soon) the planting animation — anything that needs to
// know where "down" actually is.
export const GROUND_CENTER = [0, -4.5, -6]
