export type IntentDefinition = {
  name: string
  description?: string
  /**
   * Subtle per-intent gradient tint (used in the intent grid / header).
   * Keep opacity low so the UI stays calm.
   */
  gradientClassName: string
  /**
   * 1–3 keywords used to construct a YouTube search query.
   * Keep them short and “mood-first” per UX docs.
   */
  keywords: [string] | [string, string] | [string, string, string]
}

export const INTENTS: IntentDefinition[] = [
  {
    name: "Deep Focus",
    description: "Quiet momentum. Minimal distraction.",
    gradientClassName:
      "intent-gradient-deep-focus",
    keywords: ["deep focus", "ambient", "work"],
  },
  {
    name: "Momentum",
    description: "Forward motion. Steady energy.",
    gradientClassName:
      "intent-gradient-momentum",
    keywords: ["flow", "focus", "electronic"],
  },
  {
    name: "Sprint",
    description: "Short bursts. High intent.",
    gradientClassName:
      "intent-gradient-sprint",
    keywords: ["sprint", "upbeat", "focus"],
  },
  {
    name: "Float",
    description: "Light, spacious, open.",
    gradientClassName:
      "intent-gradient-float",
    keywords: ["dreamy", "ambient", "chill"],
  },
  {
    name: "Background",
    description: "Soft texture. Fade into the room.",
    gradientClassName:
      "intent-gradient-background",
    keywords: ["lofi", "background", "study"],
  },
  {
    name: "Grind",
    description: "Hard focus. Keep pushing.",
    gradientClassName:
      "intent-gradient-grind",
    keywords: ["hard focus", "work", "industrial"],
  },
]

export function buildIntentQuery(intent: IntentDefinition) {
  return `${intent.keywords.join(" ")} music`
}

export function getIntentByName(name: string | null | undefined) {
  if (!name) return undefined
  return INTENTS.find((i) => i.name === name)
}


