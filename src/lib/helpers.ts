// Helper utilities

export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ')
}

// Format number as Egyptian currency style
export function formatNumber(v: string | number): string {
  const n = typeof v === 'string' ? parseFloat(v.replace(/,/g, '')) : v
  if (isNaN(n)) return String(v ?? '')
  return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

// Parse a number from any string (handles Arabic/English digits and commas)
export function parseNumber(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  // Convert Arabic-Indic digits to Latin
  const cleaned = String(v)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// Generate a UUID-ish id
export function genId(): string {
  return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}
