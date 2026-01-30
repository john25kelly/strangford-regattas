// Small helper to fetch with timeout using AbortController.
// Returns the fetched text on success, throws on failure/timeout.
export async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.text()
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

