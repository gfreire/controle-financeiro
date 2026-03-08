export function normalizeText(value?: string | null) {
  if (!value) return null

  return value
    .trim()
    .replace(/\s+/g, " ")
}