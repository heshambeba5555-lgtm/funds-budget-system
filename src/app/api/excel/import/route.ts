import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

// Helper: parse a number from any value (handles strings with commas)
function parseNum(v: unknown): number {
  if (v === null || v === undefined) return 0
  if (typeof v === 'number') return isNaN(v) ? 0 : v
  const cleaned = String(v)
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

// Funds columns
const FUNDS_COLS = [
  { key: 'serial', header: 'م', width: 8 },
  { key: 'code', header: 'رمزه م', width: 12 },
  { key: 'basic', header: 'الأساسي', width: 18 },
  { key: 'bound', header: 'المربوط', width: 18 },
  { key: 'exchangeNo', header: 'رقم الصرف', width: 14 },
  { key: 'name', header: 'الاسم', width: 30 },
  { key: 'administration', header: 'الإدارة', width: 18 },
  { key: 'degree', header: 'الدرجة', width: 14 },
  { key: 'job', header: 'الوظيفة', width: 18 },
  { key: 'nationalId', header: 'الرقم القومي', width: 18 },
  { key: 'qualityReward', header: 'مكافأة الجودة', width: 16 },
  { key: 'extraHours', header: 'الساعات الزائدة', width: 16 },
  { key: 'diff90', header: 'فروق 90 يوم', width: 16 },
  { key: 'total', header: 'الإجمالي', width: 18 },
]

// Budget columns
const BUDGET_COLS = [
  { key: 'code', header: 'م', width: 8 },
  { key: 'basic', header: 'الأساسي', width: 18 },
  { key: 'bound', header: 'المربوط', width: 18 },
  { key: 'exchangeNo', header: 'رقم الصرف', width: 14 },
  { key: 'name', header: 'الاسم', width: 30 },
  { key: 'administration', header: 'الإدارة', width: 18 },
  { key: 'degree', header: 'الدرجة', width: 14 },
  { key: 'job', header: 'الوظيفة', width: 18 },
  { key: 'nationalId', header: 'الرقم القومي', width: 18 },
  { key: 'teachingReward', header: 'مكافأة تدريس', width: 16 },
  { key: 'percent200', header: 'الـ 200%', width: 16 },
  { key: 'total', header: 'الإجمالي', width: 18 },
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const kind = (formData.get('kind') as string) || 'funds'
    if (!file) return NextResponse.json({ error: 'لم يتم رفع ملف' }, { status: 400 })

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(buf)

    const sheet = wb.worksheets[0]
    if (!sheet) return NextResponse.json({ error: 'لا توجد أوراق في الملف' }, { status: 400 })

    const cols = kind === 'funds' ? FUNDS_COLS : BUDGET_COLS

    // Read header row
    const headerRow = sheet.getRow(1)
    const headerMap: Record<string, number> = {}
    headerRow.eachCell((cell, colNumber) => {
      const h = String(cell.value ?? '').trim()
      headerMap[h] = colNumber
    })

    // Try to match columns by header
    const colIndexes: Record<string, number> = {}
    for (const c of cols) {
      colIndexes[c.key] = headerMap[c.header] ?? 0
    }

    const items: Record<string, unknown>[] = []
    let order = 0
    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const item: Record<string, unknown> = {}
      let anyVal = false
      for (const c of cols) {
        const idx = colIndexes[c.key]
        let val = ''
        if (idx && idx > 0) {
          const cell = row.getCell(idx)
          if (cell.value !== null && cell.value !== undefined) {
            val = String(cell.value)
            // Handle formula results
            if (cell.result !== undefined) val = String(cell.result)
          }
        }
        item[c.key] = val
        if (val) anyVal = true
      }
      // Skip empty rows
      if (!anyVal) continue
      // Skip rows that have ONLY a serial number but no name/code/nationalId
      // (i.e., empty pre-styled rows the user didn't fill)
      const hasName = (item.name && String(item.name).trim()) || ''
      const hasCode = (item.code && String(item.code).trim()) || ''
      const hasNatId = (item.nationalId && String(item.nationalId).trim()) || ''
      const hasAmount =
        parseNum(item.total) > 0 ||
        parseNum(item.qualityReward) > 0 ||
        parseNum(item.teachingReward) > 0 ||
        parseNum(item.basicSalary) > 0 ||
        parseNum(item.basic) > 0 ||
        parseNum(item.bound) > 0
      if (!hasName && !hasCode && !hasNatId && !hasAmount) {
        continue
      }
      item.order = order++
      items.push(item)
    }

    // Replace all data
    await db.member.deleteMany({ where: { kind } })
    if (items.length > 0) {
      await db.$transaction(
        items.map((item) => {
          const basic = String(item.basic ?? '')
          const bound = String(item.bound ?? '')
          const basicSalary = basic || bound
            ? (basic && bound ? `${basic}+${bound}` : (basic || bound))
            : String(item.basicSalary ?? '')
          return db.member.create({
            data: {
              kind,
              serial: String(item.serial ?? ''),
              code: String(item.code ?? ''),
              basic,
              bound,
              basicSalary,
              exchangeNo: String(item.exchangeNo ?? ''),
              name: String(item.name ?? ''),
              administration: String(item.administration ?? ''),
              degree: String(item.degree ?? ''),
              job: String(item.job ?? ''),
              nationalId: String(item.nationalId ?? ''),
              qualityReward: String(item.qualityReward ?? ''),
              extraHours: String(item.extraHours ?? ''),
              diff90: String(item.diff90 ?? ''),
              teachingReward: String(item.teachingReward ?? ''),
              percent200: String(item.percent200 ?? ''),
              total: String(item.total ?? ''),
              order: Number(item.order ?? 0),
            },
          })
        })
      )
    }

    return NextResponse.json({ ok: true, count: items.length })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
