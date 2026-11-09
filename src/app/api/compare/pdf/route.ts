import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs'

// Configure pdfjs worker for Node.js (server-side)
const workerPath = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.min.mjs')
GlobalWorkerOptions.workerSrc = workerPath

type ParsedEntry = {
  name: string
  amount: string
  nationalId?: string
  rawLine: string
  page: number
}

// Convert Arabic-Indic digits to Latin
function normalizeDigits(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
}

// Convert Arabic PRESENTATION FORM characters to their BASIC forms
// PDFs from Oracle often use presentation forms (e.g. ﻥ instead of ن)
// Range: U+FB50-U+FDFF (Arabic Presentation Forms-A) and U+FE70-U+FEFF (Arabic Presentation Forms-B)
function normalizeArabicForms(s: string): string {
  // Use NFKC normalization to decompose presentation forms to basic Arabic letters
  return s.normalize('NFKC')
}

// Full normalization: presentation forms + digits
function normalizeAll(s: string): string {
  return normalizeDigits(normalizeArabicForms(s))
}

// Parse a number string (handles Arabic decimal separator "٫" and Latin ".")
function parseAmount(s: string): number {
  const cleaned = normalizeAll(s).replace(/,/g, '').replace(/٫/g, '.').replace(/[^\d.-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// Extract employee name from line containing "اسم الموظف"
// Pattern: "<nationalId> الرقم القومى: <ref> رقم الصرف: <NAME> اسم الموظف:"
// The name appears BEFORE "اسم الموظف:" (between "رقم الصرف:" and "اسم الموظف:")
function extractEmployeeName(line: string): string | null {
  const norm = normalizeAll(line)
  // Look for "اسم الموظف"
  const empIdx = norm.indexOf('اسم الموظف')
  if (empIdx < 0) return null
  // Look for "رقم الصرف" before it
  const sarfIdx = norm.indexOf('رقم الصرف')
  if (sarfIdx < 0 || sarfIdx >= empIdx) {
    // Fallback: take everything between the last ":" and "اسم الموظف"
    // The name is just before "اسم الموظف"
    const before = norm.slice(0, empIdx).trim()
    // Remove trailing colon
    const cleaned = before.replace(/[:：\s]+$/, '').trim()
    // Find the Arabic name portion (last Arabic sequence)
    const arabicMatches = cleaned.match(/[\u0600-\u06FF][\u0600-\u06FF\s]+/g)
    if (arabicMatches && arabicMatches.length > 0) {
      const name = arabicMatches[arabicMatches.length - 1].trim()
      // Filter out words that are labels (not names)
      const labels = ['الرقم القومى', 'رقم الصرف', 'القومى', 'الصرف', 'الفرع', 'البنك', 'الإدارة', 'الدرجة']
      if (!labels.includes(name) && name.length >= 3) {
        return name
      }
    }
    return null
  }
  // Extract text between "رقم الصرف:" and "اسم الموظف"
  const between = norm.slice(sarfIdx + 'رقم الصرف'.length, empIdx)
  // Remove leading colon and spaces
  const cleaned = between.replace(/^[:：\s]+/, '').trim()
  if (!cleaned) return null
  // The name is Arabic letters and spaces
  const match = cleaned.match(/^[\u0600-\u06FF\s]+/)
  if (match) {
    const name = match[0].trim()
    if (name.length >= 3) return name
  }
  return null
}

// Extract national ID from "الرقم القومى:" line
// Pattern: "<nationalId> الرقم القومى: <ref>"
function extractNationalId(line: string): string | null {
  const norm = normalizeAll(line)
  const idx = norm.indexOf('الرقم القوم')
  if (idx < 0) return null
  // National ID is the digits BEFORE "الرقم القوم"
  const before = norm.slice(0, idx)
  // Find the last 14-digit number
  const matches = before.match(/\d{14}/g)
  if (matches && matches.length > 0) {
    return matches[matches.length - 1]
  }
  // Also try 13-15 digit numbers (some national IDs may have different lengths)
  const matchesAny = before.match(/\d{13,15}/g)
  if (matchesAny && matchesAny.length > 0) {
    return matchesAny[matchesAny.length - 1]
  }
  return null
}

// Extract total entitlements amount - look for "أجمالى الاستحقاقات" or variations
// Pattern: "<amount> أجمالى الاستحقاقات" (amount is BEFORE the label)
function extractTotalEntitlements(lines: string[]): number | null {
  for (let i = 0; i < lines.length; i++) {
    const norm = normalizeAll(lines[i])
    // Check if this line contains "الاستحقاقات" and "إجمالي"/"أجمالى"/"اجمالى"
    if (norm.includes('الاستحقاقات') &&
        (norm.includes('إجمالي') || norm.includes('أجمالى') || norm.includes('اجمالى') || norm.includes('إجمالى') || norm.includes('اجمالي'))) {
      // The amount is BEFORE the label OR on the same line just before
      // Try to find a decimal number in the line
      const matches = norm.match(/\d+[\.,٫]\d+/g)
      if (matches && matches.length > 0) {
        const amt = parseAmount(matches[matches.length - 1])
        if (amt > 0) return amt
      }
      // Also try the previous line
      if (i > 0) {
        const prevNorm = normalizeAll(lines[i - 1])
        const prevMatches = prevNorm.match(/\d+[\.,٫]\d+/g)
        if (prevMatches && prevMatches.length > 0) {
          const amt = parseAmount(prevMatches[prevMatches.length - 1])
          if (amt > 0) return amt
        }
      }
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'لم يتم رفع ملف PDF' }, { status: 400 })
    }

    const buf = new Uint8Array(await file.arrayBuffer())
    const loadingTask = getDocument({ data: buf })
    const doc = await loadingTask.promise

    const totalPages = doc.numPages
    const entries: ParsedEntry[] = []

    for (let p = 1; p <= totalPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      // Group items by line (using Y position)
      const lines = new Map<number, { text: string; x: number }[]>()
      for (const item of content.items) {
        if (!('str' in item)) continue
        const str = item.str
        if (!str || !str.trim()) continue
        const transform = item.transform as number[]
        const y = Math.round(transform[5])
        const x = transform[4]
        if (!lines.has(y)) lines.set(y, [])
        lines.get(y)!.push({ text: str, x })
      }
      // Sort lines by Y descending (top of page is higher Y)
      const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a)
      // Join items in each line by their X position
      const lineTexts: string[] = []
      for (const y of sortedYs) {
        const items = lines.get(y)!.sort((a, b) => a.x - b.x)
        // Join with no space (since Arabic PDFs often have items adjacent)
        // but add space between items that are far apart
        const parts: string[] = []
        let prevX: number | null = null
        for (const it of items) {
          if (prevX !== null && it.x - prevX > 5) {
            parts.push(' ')
          }
          parts.push(it.text)
          prevX = it.x + (it.text.length * 2) // rough estimate
        }
        const lineText = parts.join('').replace(/\s+/g, ' ').trim()
        if (lineText) lineTexts.push(lineText)
      }

      // Now extract: name, nationalId, total entitlements
      let name: string | null = null
      let nationalId: string | null = null
      let totalAmount: number | null = null

      for (const line of lineTexts) {
        if (!name) {
          name = extractEmployeeName(line)
        }
        if (!nationalId) {
          nationalId = extractNationalId(line)
        }
      }
      totalAmount = extractTotalEntitlements(lineTexts)

      // Only add if we have a name AND an amount
      if (name && totalAmount !== null && totalAmount > 0) {
        entries.push({
          name,
          amount: totalAmount.toFixed(2),
          nationalId: nationalId || undefined,
          rawLine: `الاسم: ${name} | الرقم القومي: ${nationalId || '-'} | الإجمالي: ${totalAmount.toFixed(2)}`,
          page: p,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      entries,
      totalPages,
      rawTextLength: 0,
    })
  } catch (e) {
    console.error('PDF parse error:', e)
    return NextResponse.json({ error: 'فشل قراءة ملف PDF: ' + (e as Error).message }, { status: 500 })
  }
}
