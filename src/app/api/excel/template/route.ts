import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

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

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind') || 'funds'
  const cols = kind === 'funds' ? FUNDS_COLS : BUDGET_COLS

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Hesham Mohamed Eid - Faculty of Computers & AI - Beni-Suef University'
  wb.created = new Date()

  // Sheet 1: Data template (empty rows for the user to fill)
  const sheetName = kind === 'funds' ? 'صناديق خاصة' : 'موازنة'
  const sheet = wb.addWorksheet(sheetName, {
    views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = cols.map((c) => ({
    header: c.header,
    key: c.key,
    width: Math.max(14, c.width),
  }))

  // Style header row
  const headerRow = sheet.getRow(1)
  headerRow.height = 32
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0E7C7B' },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF000000' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
    }
  })

  // Add 10 empty styled data rows (no pre-filled values)
  for (let i = 0; i < 10; i++) {
    const r = sheet.getRow(i + 2)
    r.height = 22
    cols.forEach((c) => {
      const cell = r.getCell(c.key)
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      }
    })
    r.commit()
  }

  // Sheet 2: Instructions (separate sheet, not imported as data)
  const noteSheet = wb.addWorksheet('تعليمات', {
    views: [{ rightToLeft: true }],
  })
  noteSheet.columns = [{ header: 'التعليمات', key: 'note', width: 100 }]

  const noteHeaderRow = noteSheet.getRow(1)
  noteHeaderRow.height = 30
  noteHeaderRow.eachCell((cell) => {
    cell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0E7C7B' },
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  const instructions =
    kind === 'funds'
      ? [
          'قالب شيت صناديق خاصة',
          '',
          'الأعمدة المطلوبة (بنفس الترتيب):',
          '1. م (رقم مسلسل)',
          '2. رمزه م (رمز الدكتور)',
          '3. الأساسي',
          '4. المربوط',
          '5. رقم الصرف',
          '6. الاسم',
          '7. الإدارة',
          '8. الدرجة',
          '9. الوظيفة',
          '10. الرقم القومي',
          '11. مكافأة الجودة',
          '12. الساعات الزائدة',
          '13. فروق 90 يوم',
          '14. الإجمالي',
          '',
          'خطوات الاستخدام:',
          '1. املأ البيانات في شيت "صناديق خاصة" بالأعمدة المذكورة.',
          '2. احذف الصفوف الفارغة الزائدة (إن وجدت).',
          '3. احفظ الملف بصيغة .xlsx',
          '4. افتح البرنامج ← تابة الداتا ← شيت صناديق خاصة ← "استيراد Excel".',
          '5. اختر الملف المحفوظ.',
          '',
          'ملاحظة: لا تقم بتعديل أسماء الأعمدة في الصف الأول.',
        ]
      : [
          'قالب شيت الموازنة',
          '',
          'الأعمدة المطلوبة (بنفس الترتيب):',
          '1. م (رقم مسلسل)',
          '2. الأساسي',
          '3. المربوط',
          '4. رقم الصرف',
          '5. الاسم',
          '6. الإدارة',
          '7. الدرجة',
          '8. الوظيفة',
          '9. الرقم القومي',
          '10. مكافأة تدريس',
          '11. الـ 200%',
          '12. الإجمالي',
          '',
          'خطوات الاستخدام:',
          '1. املأ البيانات في شيت "موازنة" بالأعمدة المذكورة.',
          '2. احذف الصفوف الفارغة الزائدة (إن وجدت).',
          '3. احفظ الملف بصيغة .xlsx',
          '4. افتح البرنامج ← تابة الداتا ← شيت الموازنة ← "استيراد Excel".',
          '5. اختر الملف المحفوظ.',
          '',
          'ملاحظة: لا تقم بتعديل أسماء الأعمدة في الصف الأول.',
        ]

  instructions.forEach((line, i) => {
    const row = noteSheet.getRow(i + 2)
    row.height = 22
    const cell = row.getCell(1)
    cell.value = line
    cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true }
    if (line.startsWith('قالب')) {
      cell.font = { bold: true, size: 13 }
    } else if (line.startsWith('خطوات') || line.startsWith('الأعمدة')) {
      cell.font = { bold: true, size: 11, color: { argb: 'FF0E7C7B' } }
    } else {
      cell.font = { size: 11 }
    }
  })

  // Make the data sheet active by default
  wb.views = [{ activeTab: 0 }]

  const buffer = await wb.xlsx.writeBuffer()
  const fname = kind === 'funds' ? 'template-funds.xlsx' : 'template-budget.xlsx'
  return new NextResponse(Buffer.from(buffer), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  })
}
