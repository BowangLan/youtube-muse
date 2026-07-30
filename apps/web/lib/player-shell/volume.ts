// Perceptual volume curve: linear volume feels too loud at the low end,
// so map through an exponential curve. Each backend applies its own output range.

/** 0–100 output (YouTube player) */
export const normalizeVolume100 = (volume: number) => {
  return ((Math.exp(volume / 100) - 1) / (Math.E - 1)) * 100
}

/** 0–1 output (Spotify Web Playback SDK) */
export const normalizeVolume1 = (volume: number) => {
  return (Math.exp(volume / 100) - 1) / (Math.E - 1)
}
