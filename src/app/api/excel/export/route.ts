import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ExcelJS from 'exceljs'

const FUNDS_COLS = [
  { key: 'serial', header: 'م' },
  { key: 'code', header: 'رمزه م' },
  { key: 'basic', header: 'الأساسي' },
  { key: 'bound', header: 'المربوط' },
  { key: 'exchangeNo', header: 'رقم الصرف' },
  { key: 'name', header: 'الاسم' },
  { key: 'administration', header: 'الإدارة' },
  { key: 'degree', header: 'الدرجة' },
  { key: 'job', header: 'الوظيفة' },
  { key: 'nationalId', header: 'الرقم القومي' },
  { key: 'qualityReward', header: 'مكافأة الجودة' },
  { key: 'extraHours', header: 'الساعات الزائدة' },
  { key: 'diff90', header: 'فروق 90 يوم' },
  { key: 'total', header: 'الإجمالي' },
]

const BUDGET_COLS = [
  { key: 'code', header: 'م' },
  { key: 'basic', header: 'الأساسي' },
  { key: 'bound', header: 'المربوط' },
  { key: 'exchangeNo', header: 'رقم الصرف' },
  { key: 'name', header: 'الاسم' },
  { key: 'administration', header: 'الإدارة' },
  { key: 'degree', header: 'الدرجة' },
  { key: 'job', header: 'الوظيفة' },
  { key: 'nationalId', header: 'الرقم القومي' },
  { key: 'teachingReward', header: 'مكافأة تدريس' },
  { key: 'percent200', header: 'الـ 200%' },
  { key: 'total', header: 'الإجمالي' },
]

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') || 'funds'
  const members = await db.member.findMany({
    where: { kind },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  const extraCols = await db.columnDef.findMany({
    where: { kind },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })

  const cols = kind === 'funds' ? FUNDS_COLS : BUDGET_COLS
  const allCols = [...cols, ...extraCols.map((c) => ({ key: `extra_${c.key}`, header: c.label }))]

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Hesham Mohamed Eid'
  wb.created = new Date()
  const sheet = wb.addWorksheet(kind === 'funds' ? 'صناديق خاصة' : 'موازنة', {
    views: [{ rightToLeft: true }],
  })

  // Header
  sheet.columns = allCols.map((c, i) => ({
    header: c.header,
    key: c.key,
    width: Math.max(12, String(c.header).length + 4),
  }))

  // Style header
  const headerRow = sheet.getRow(1)
  headerRow.height = 28
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0E7C7B' },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // Data
  for (const m of members) {
    const row: Record<string, unknown> = {}
    for (const c of cols) {
      row[c.key] = (m as Record<string, unknown>)[c.key] ?? ''
    }
    // Extra columns
    let extra: Record<string, string> = {}
    try {
      extra = JSON.parse(m.extraColumns || '{}')
    } catch {
      extra = {}
    }
    for (const ec of extraCols) {
      const k = ec.key.replace(/^extra_/, '')
      row[ec.key] = extra[k] ?? ''
    }
    sheet.addRow(row)
  }

  // Total row
  const totalRow: Record<string, unknown> = {}
  totalRow[allCols[0].key] = 'الإجمالي'
  // Sum numeric columns
  const numericKeys = ['basic', 'bound', 'qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200', 'total']
  for (const k of numericKeys) {
    if (allCols.find((c) => c.key === k)) {
      let sum = 0
      for (const m of members) {
        const v = (m as Record<string, unknown>)[k] as string
        if (v) {
          const n = parseFloat(String(v).replace(/[^\d.-]/g, ''))
          if (!isNaN(n)) sum += n
        }
      }
      totalRow[k] = sum
    }
  }
  sheet.addRow(totalRow)
  const totalsRowNumber = sheet.rowCount
  const lastRow = sheet.lastRow
  if (lastRow) {
    lastRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFE08A' },
      }
    })
  }

  // --- التوقيعات تحت الشيت ---
  // Add 2 empty rows then signatures row
  sheet.addRow({})
  sheet.addRow({})
  const sigSetting = await db.setting.findUnique({ where: { id: 'global' } })
  let signatures: { label: string; name: string }[] = []
  try {
    signatures = JSON.parse(sigSetting?.signatures || '[]')
  } catch {
    signatures = []
  }
  if (signatures.length > 0) {
    // Merge cells for each signature block - distribute across columns
    const totalCols = allCols.length
    const perSig = Math.max(1, Math.floor(totalCols / signatures.length))
    const sigRowNum = sheet.rowCount + 1
    // Empty signature line row
    const lineRow: Record<string, unknown> = {}
    for (let i = 0; i < signatures.length; i++) {
      const startCol = i * perSig + 1
      lineRow[allCols[0].key] = i === 0 ? '' : ''
    }
    sheet.addRow(lineRow)
    // Label row
    const labelRow: Record<string, unknown> = {}
    for (let i = 0; i < signatures.length; i++) {
      const startCol = i * perSig + 1
      labelRow[allCols[startCol - 1].key] = signatures[i].label + (signatures[i].name ? `: ${signatures[i].name}` : '')
    }
    sheet.addRow(labelRow)
    // Merge cells per signature block and add borders
    for (let i = 0; i < signatures.length; i++) {
      const startCol = i * perSig + 1
      const endCol = Math.min(totalCols, startCol + perSig - 1)
      // Merge signature line (one row above labels)
      sheet.mergeCells(sigRowNum, startCol, sigRowNum, endCol)
      sheet.mergeCells(sigRowNum + 1, startCol, sigRowNum + 1, endCol)
      // Style: bottom border on line row to act as signature underline
      const lineCell = sheet.getCell(sigRowNum, startCol)
      lineCell.border = {
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
      }
      lineCell.value = ' '
      lineCell.height = 40
      const labelCell = sheet.getCell(sigRowNum + 1, startCol)
      labelCell.font = { bold: true, size: 11 }
      labelCell.alignment = { horizontal: 'center', vertical: 'middle' }
      labelCell.value = signatures[i].label + (signatures[i].name ? `: ${signatures[i].name}` : '')
    }
    sheet.getRow(sigRowNum).height = 50
  }

  // Border all data cells
  sheet.eachRow((row, ri) => {
    if (ri === 1) return
    if (ri > totalsRowNumber) return // skip signature rows
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const fname = kind === 'funds' ? 'special-funds.xlsx' : 'budget.xlsx'
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  })
}
