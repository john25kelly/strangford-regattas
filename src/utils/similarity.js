// Small string similarity helper (Sørensen–Dice on bigrams).
// Exports the function and also attaches it to window.similarity for any code
// that expects a global. Keep implementation small and deterministic.
export default function similarity(a, b) {
  if (!a || !b) return 0
  const s = String(a).toLowerCase()
  const t = String(b).toLowerCase()
  if (s === t) return 1
  if (s.length < 2 || t.length < 2) return 0
  const bigrams = (str) => {
    const res = new Map()
    for (let i = 0; i < str.length - 1; i++) {
      const g = str.slice(i, i + 2)
      res.set(g, (res.get(g) || 0) + 1)
    }
    return res
  }
  const aMap = bigrams(s)
  const bMap = bigrams(t)
  let intersection = 0
  for (const [g, count] of aMap.entries()) {
    if (bMap.has(g)) intersection += Math.min(count, bMap.get(g))
  }
  const total = (Array.from(aMap.values()).reduce((a, b) => a + b, 0) + Array.from(bMap.values()).reduce((a, b) => a + b, 0))
  const score = total === 0 ? 0 : (2 * intersection) / total

  // Attach to window for legacy/global usage if running in browser.
  try {
    if (typeof window !== 'undefined') window.similarity = similarity
  } catch (e) {
    // ignore
  }

  return score
}

