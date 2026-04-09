/**
 * All available gradient class names (1-22)
 * Used for custom intent creation
 */
export const GRADIENT_CLASS_NAMES = [
  "intent-gradient-1",  // Deep Focus - sky to indigo to fuchsia
  "intent-gradient-2",  // Momentum - emerald to cyan to blue
  "intent-gradient-3",  // Sprint - amber to orange to rose
  "intent-gradient-4",  // Float - violet to sky to emerald
  "intent-gradient-5",  // Background - zinc to slate to indigo
  "intent-gradient-6",  // Grind - red to orange to yellow
  "intent-gradient-7",  // Ultraviolet - purple to pink to orange
  "intent-gradient-8",  // Rainforest - cyan to emerald to lime
  "intent-gradient-9",  // Crimson Dusk - rose to purple to indigo
  "intent-gradient-10", // Solar Flare - amber to red to fuchsia
  "intent-gradient-11", // Electric Blue - cyan to blue to violet
  "intent-gradient-12", // Coral Sunset - pink to red to amber
  "intent-gradient-13", // Ocean Depths - teal to navy to indigo
  "intent-gradient-14", // Aurora Borealis - mint to cyan to electric blue
  "intent-gradient-15", // Sunset Beach - coral to pink to magenta
  "intent-gradient-16", // Emerald Forest - emerald to teal to sea green
  "intent-gradient-17", // Neon Nights - hot pink to electric blue to violet
  "intent-gradient-18", // Golden Hour - amber to orange to warm rose
  "intent-gradient-19", // Lavender Dreams - lilac to periwinkle to sky
  "intent-gradient-20", // Cherry Blossom - soft pink to peach to coral
  "intent-gradient-21", // Midnight Galaxy - deep purple to indigo to dark blue
  "intent-gradient-22", // Tropical Paradise - lime to turquoise to aqua
] as const

export type GradientClassName = (typeof GRADIENT_CLASS_NAMES)[number]

export type IntentDefinition = {
  name: string
  description?: string
  /**
   * Subtle per-intent gradient tint (used in the intent grid / header).
   * Keep opacity low so the UI stays calm.
   */
  gradientClassName: GradientClassName
  /**
   * 1–3 keywords used to construct a YouTube search query.
   * Keep them short and "mood-first" per UX docs.
   */
  keywords: string[]
}

export const INTENTS: IntentDefinition[] = [
  {
    name: "Deep Focus",
    description: "Quiet momentum. Minimal distraction.",
    gradientClassName: "intent-gradient-1",
    keywords: ["music", "deep focus", "ambient", "work"],
  },
  {
    name: "Momentum",
    description: "Forward motion. Steady energy.",
    gradientClassName: "intent-gradient-2",
    keywords: ["music", "flow", "focus", "electronic"],
  },
  {
    name: "Sprint",
    description: "Short bursts. High intent.",
    gradientClassName: "intent-gradient-3",
    keywords: ["music", "sprint", "upbeat", "focus"],
  },
  {
    name: "Float",
    description: "Light, spacious, open.",
    gradientClassName: "intent-gradient-4",
    keywords: ["music", "dreamy", "ambient", "chill"],
  },
  {
    name: "Background",
    description: "Soft texture. Fade into the room.",
    gradientClassName: "intent-gradient-5",
    keywords: ["music", "lofi", "background", "study"],
  },
  {
    name: "Grind",
    description: "Hard focus. Keep pushing.",
    gradientClassName: "intent-gradient-6",
    keywords: ["music", "hard focus", "work", "industrial"],
  },
]

export function buildIntentQuery(intent: IntentDefinition) {
  return `${intent.keywords.join(" ")} music`
}

export function getIntentByName(name: string | null | undefined) {
  if (!name) return undefined
  return INTENTS.find((i) => i.name === name)
}

/**
 * Build a query from custom keywords (for custom intents)
 */
export function buildCustomIntentQuery(keywords: string[]): string {
  return `${keywords.join(" ")}`
}

/**
 * Get a random gradient class name for custom intents
 * Optionally exclude gradients 1-6 which are used by built-in intents
 */
export function getRandomGradient(excludeBuiltIn = true): GradientClassName {
  const startIndex = excludeBuiltIn ? 6 : 0
  const availableGradients = GRADIENT_CLASS_NAMES.slice(startIndex)
  return availableGradients[Math.floor(Math.random() * availableGradients.length)]
}
