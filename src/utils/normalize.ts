// utils/normalize.ts

export function normalizeText(value: string | null | undefined) {
  if (!value) return null
  return value.trim().replace(/\s+/g, ' ')
}