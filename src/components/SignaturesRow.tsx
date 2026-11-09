'use client'

import { useStore, type Signature } from '@/lib/store'

// Renders a row of signature blocks under the sheet
// Each signature: a horizontal line (for handwritten signature), then a label, then optionally a name
export function SignaturesRow() {
  const { setting } = useStore()
  if (!setting) return null

  let sigs: Signature[] = []
  try {
    sigs = JSON.parse(setting.signatures || '[]')
  } catch {
    sigs = []
  }
  if (sigs.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6 border-t bg-card">
      {sigs.map((s, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          {/* Line for handwritten signature */}
          <div className="w-full border-b-2 border-foreground/70 mb-2 h-12" />
          {/* Label */}
          <div className="text-sm font-bold text-foreground">{s.label}</div>
          {/* Name (optional) */}
          {s.name ? (
            <div className="text-sm text-muted-foreground mt-0.5">{s.name}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
