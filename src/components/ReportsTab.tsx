'use client'

import * as React from 'react'
import { Printer, FileText, Download, FileSpreadsheet } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReportHeader } from '@/components/ReportHeader'
import { SignaturesRow } from '@/components/SignaturesRow'
import { useStore } from '@/lib/store'
import { parseNumber, formatNumber } from '@/lib/helpers'
import type { Member, Leave } from '@/lib/store'
import { toast } from 'sonner'
import { format, parseISO, isValid, differenceInDays } from 'date-fns'
import { ar } from 'date-fns/locale'

// Arabic month names (matching settings)
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

// Reward column keys (for forfeiture logic)
const REWARD_COL_KEYS = ['qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200']

export function ReportsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">تابة التقارير</h2>
        <p className="text-muted-foreground">ثلاثة تقارير: صناديق خاصة - موازنة - الإجازات. مع الترويسة والشعارات والعام والشهر والتوقيعات.</p>
      </div>
      <Tabs defaultValue="funds">
        <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
          <TabsTrigger value="funds">تقرير الصناديق الخاصة</TabsTrigger>
          <TabsTrigger value="budget">تقرير الموازنة</TabsTrigger>
          <TabsTrigger value="leaves">تقرير الإجازات</TabsTrigger>
        </TabsList>
        <TabsContent value="funds">
          <ReportView kind="funds" />
        </TabsContent>
        <TabsContent value="budget">
          <ReportView kind="budget" />
        </TabsContent>
        <TabsContent value="leaves">
          <LeavesReportView />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const FUNDS_COLS = [
  { key: 'serial', header: 'م' },
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
] as const

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
] as const

function ReportView({ kind }: { kind: 'funds' | 'budget' }) {
  const { setting } = useStore()
  const [rows, setRows] = React.useState<Member[]>([])
  const [leaves, setLeaves] = React.useState<Leave[]>([])
  const reportRef = React.useRef<HTMLDivElement>(null)

  const load = async () => {
    const r = await fetch(`/api/members?kind=${kind}`)
    const data = await r.json()
    setRows(data)
    // Load leaves for forfeiture check
    const r2 = await fetch('/api/leaves')
    const leavesData = await r2.json()
    setLeaves(leavesData)
  }
  React.useEffect(() => { load() }, [kind])

  const cols = kind === 'funds' ? FUNDS_COLS : BUDGET_COLS

  // Forfeiting leave types from settings
  const forfeitingLeaveTypes: string[] = (() => {
    try { return JSON.parse(setting?.forfeitingLeaveTypes || '["بدون مرتب"]') as string[] } catch { return ['بدون مرتب'] }
  })()

  // Check if a member is on a forfeiting leave
  const isForfeited = (member: Member): boolean => {
    if (!setting?.month) return false
    const memberName = member.name || ''
    if (!memberName) return false
    const memberLeaves = leaves.filter((l) => l.doctorName === memberName)
    if (memberLeaves.length === 0) return false
    const monthIdx = MONTH_NAMES.indexOf(setting.month)
    if (monthIdx < 0) return false
    const yearMatch = setting.academicYear?.match(/^(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
    const yearsToCheck = [year, year + 1]
    for (const periodYear of yearsToCheck) {
      const periodStart = new Date(periodYear, monthIdx, 1)
      const periodEnd = new Date(periodYear, monthIdx + 1, 0, 23, 59, 59)
      for (const l of memberLeaves) {
        if (!l.fromDate || !l.toDate) continue
        const from = new Date(l.fromDate)
        const to = new Date(l.toDate)
        if (from <= periodEnd && to >= periodStart) {
          if (forfeitingLeaveTypes.includes(l.leaveType)) {
            return true
          }
        }
      }
    }
    return false
  }

  const print = () => window.print()

  // Export to PDF using html2canvas (renders Arabic perfectly via image capture)
  const exportPDF = async () => {
    if (!reportRef.current) return
    toast.info('جارٍ تجهيز ملف PDF...')
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20 // 10mm margin both sides
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - 20)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
        heightLeft -= (pageHeight - 20)
      }

      const fname = kind === 'funds' ? 'report-funds.pdf' : 'report-budget.pdf'
      pdf.save(fname)
      toast.success('تم تصدير PDF بنجاح')
    } catch (e) {
      console.error(e)
      toast.error('فشل تصدير PDF: ' + (e as Error).message)
    }
  }

  // Export to Excel by hitting the data API export endpoint
  const exportExcel = () => {
    window.open(`/api/excel/export?kind=${kind}`, '_blank')
    toast.success('جارٍ تصدير Excel...')
  }

  const totals: Record<string, number> = {}
  for (const c of cols) {
    if (['basic', 'bound', 'qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200', 'total'].includes(c.key)) {
      const isRewardCol = REWARD_COL_KEYS.includes(c.key)
      const isTotalCol = c.key === 'total'
      totals[c.key] = rows.reduce((s, r) => {
        const forfeited = isForfeited(r)
        // Exclude reward columns and total for forfeited rows
        if (forfeited && (isRewardCol || isTotalCol)) {
          return s
        }
        return s + parseNumber((r as Record<string, unknown>)[c.key] as string)
      }, 0)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="no-print flex flex-wrap justify-end gap-2 p-3 bg-muted/30 border-b">
        <Button onClick={print} variant="outline" size="sm">
          <Printer className="size-4 ml-1" /> طباعة
        </Button>
        <Button onClick={exportExcel} variant="outline" size="sm">
          <FileSpreadsheet className="size-4 ml-1" /> تصدير Excel
        </Button>
        <Button onClick={exportPDF} variant="default" size="sm">
          <Download className="size-4 ml-1" /> تصدير PDF
        </Button>
      </div>
      {/* The printable/exportable report - captured by html2canvas */}
      <div ref={reportRef} className="bg-white">
        <ReportHeader reportName={kind === 'funds' ? 'صناديق خاصة أعضاء هيئة التدريس ومعاونيهم' : 'موازنة أعضاء هيئة التدريس ومعاونيهم'} />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  {cols.map((c) => (
                    <th key={c.key} className="border border-primary-foreground/30 p-2 text-center min-w-24">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={cols.length} className="text-center p-8 text-muted-foreground">
                      لا توجد بيانات. توجه إلى تابة الداتا لاستيراد البيانات.
                    </td>
                  </tr>
                )}
                {rows.map((r, idx) => {
                  const forfeited = isForfeited(r)
                  return (
                    <tr
                      key={r.id || idx}
                      className={forfeited
                        ? 'bg-red-50 border-r-4 border-red-500'
                        : (idx % 2 === 0 ? 'bg-card' : 'bg-muted/20')
                      }
                    >
                      {cols.map((c) => {
                        let v = (r as Record<string, unknown>)[c.key] as string
                        // For forfeited rows: display reward columns and total as 0
                        if (forfeited && (REWARD_COL_KEYS.includes(c.key) || c.key === 'total')) {
                          v = '0'
                        }
                        if (['basic', 'bound', 'qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200', 'total'].includes(c.key)) {
                          return (
                            <td
                              key={c.key}
                              className={`border p-2 text-center font-mono ${
                                forfeited && (REWARD_COL_KEYS.includes(c.key) || c.key === 'total')
                                  ? 'bg-red-100 text-red-900 line-through'
                                  : ''
                              }`}
                            >
                              {formatNumber(v || '0')}
                            </td>
                          )
                        }
                        return <td key={c.key} className="border p-2 text-center">{v || '-'}</td>
                      })}
                    </tr>
                  )
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-accent/70 font-bold">
                    {cols.map((c, i) => (
                      <td key={c.key} className="border p-2 text-center">
                        {i === 0 ? 'الإجمالي' : totals[c.key] !== undefined ? formatNumber(totals[c.key]) : ''}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
        <div className="p-4 bg-muted/20 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">عدد الأعضاء:</span>
              <span className="font-bold">{rows.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي القيم:</span>
              <span className="font-bold text-primary">{formatNumber(totals['total'] || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">العام:</span>
              <span className="font-bold">{setting?.academicYear || '-'}</span>
            </div>
          </div>
        </div>
        {/* التوقيعات تحت الشيت */}
        <SignaturesRow />
      </div>
    </Card>
  )
}

// ---------- تقرير الإجازات ----------
const LEAVE_COLS = [
  { key: 'idx', header: 'م' },
  { key: 'doctorName', header: 'اسم الدكتور' },
  { key: 'leaveType', header: 'نوع الإجازة' },
  { key: 'fromDate', header: 'من تاريخ' },
  { key: 'toDate', header: 'إلى تاريخ' },
  { key: 'days', header: 'عدد الأيام' },
  { key: 'degree', header: 'الدرجة' },
  { key: 'conditions', header: 'شروط المكافأة' },
  { key: 'notes', header: 'ملاحظات' },
] as const

function LeavesReportView() {
  const { setting } = useStore()
  const [leaves, setLeaves] = React.useState<Leave[]>([])
  const reportRef = React.useRef<HTMLDivElement>(null)

  const load = async () => {
    const r = await fetch('/api/leaves')
    const data = await r.json()
    setLeaves(data)
  }
  React.useEffect(() => { load() }, [])

  const print = () => window.print()

  const exportPDF = async () => {
    if (!reportRef.current) return
    toast.info('جارٍ تجهيز ملف PDF...')
    try {
      const html2canvas = (await import('html2canvas-pro')).default
      const { jsPDF } = await import('jspdf')

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 10
      pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - 20)
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 10, position, imgWidth, imgHeight)
        heightLeft -= (pageHeight - 20)
      }

      pdf.save('report-leaves.pdf')
      toast.success('تم تصدير PDF بنجاح')
    } catch (e) {
      console.error(e)
      toast.error('فشل تصدير PDF: ' + (e as Error).message)
    }
  }

  // Format ISO date → Arabic display
  const formatDateAr = (iso: string): string => {
    if (!iso) return '-'
    try {
      const d = parseISO(iso)
      if (!isValid(d)) return iso
      return format(d, 'd MMMM yyyy', { locale: ar })
    } catch {
      return iso
    }
  }

  // Compute number of leave days
  const computeDays = (fromDate: string, toDate: string): number => {
    if (!fromDate || !toDate) return 0
    try {
      const from = parseISO(fromDate)
      const to = parseISO(toDate)
      if (!isValid(from) || !isValid(to)) return 0
      return differenceInDays(to, from) + 1 // inclusive of both start and end
    } catch {
      return 0
    }
  }

  // Statistics
  const stats: Record<string, number> = {}
  let totalDays = 0
  for (const l of leaves) {
    if (l.leaveType) stats[l.leaveType] = (stats[l.leaveType] || 0) + 1
    totalDays += computeDays(l.fromDate, l.toDate)
  }

  return (
    <Card className="overflow-hidden">
      <div className="no-print flex flex-wrap justify-end gap-2 p-3 bg-muted/30 border-b">
        <Button onClick={print} variant="outline" size="sm">
          <Printer className="size-4 ml-1" /> طباعة
        </Button>
        <Button onClick={exportPDF} variant="default" size="sm">
          <Download className="size-4 ml-1" /> تصدير PDF
        </Button>
      </div>
      {/* The printable/exportable report - captured by html2canvas */}
      <div ref={reportRef} className="bg-white">
        <ReportHeader reportName="تقرير إجازات أعضاء هيئة التدريس ومعاونيهم" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  {LEAVE_COLS.map((c) => (
                    <th key={c.key} className="border border-primary-foreground/30 p-2 text-center min-w-24">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={LEAVE_COLS.length} className="text-center p-8 text-muted-foreground">
                      لا توجد إجازات مسجلة. توجه إلى تابة الإجازات لإضافة إجازات.
                    </td>
                  </tr>
                )}
                {leaves.map((l, idx) => {
                  let conds: { rewardType: string; base: string; percent: string; value: string }[] = []
                  try { conds = JSON.parse(l.conditions || '[]') } catch { conds = [] }
                  return (
                    <tr key={l.id} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <td className="border p-2 text-center">{idx + 1}</td>
                      <td className="border p-2 text-center font-medium">{l.doctorName}</td>
                      <td className="border p-2 text-center">{l.leaveType}</td>
                      <td className="border p-2 text-center whitespace-nowrap">{formatDateAr(l.fromDate)}</td>
                      <td className="border p-2 text-center whitespace-nowrap">{formatDateAr(l.toDate)}</td>
                      <td className="border p-2 text-center font-mono">{computeDays(l.fromDate, l.toDate)}</td>
                      <td className="border p-2 text-center">{l.degree || '-'}</td>
                      <td className="border p-2 text-center text-xs">
                        {conds.length === 0 ? (
                          <span className="text-muted-foreground">لا يوجد</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {conds.map((c, i) => (
                              <span key={i} className="bg-accent/40 px-1.5 py-0.5 rounded">
                                {c.rewardType}: {formatNumber(c.value)} ({c.percent}%)
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="border p-2 text-center text-xs text-muted-foreground">{l.notes || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        <div className="p-4 bg-muted/20 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">عدد الإجازات:</span>
              <span className="font-bold">{leaves.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">إجمالي أيام الإجازات:</span>
              <span className="font-bold text-primary">{totalDays}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">العام:</span>
              <span className="font-bold">{setting?.academicYear || '-'}</span>
            </div>
          </div>
          {/* إحصائية بأنواع الإجازات */}
          {Object.keys(stats).length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-muted-foreground mb-1">إحصائية بأنواع الإجازات:</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats).map(([type, count]) => (
                  <span key={type} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* التوقيعات تحت الشيت */}
        <SignaturesRow />
      </div>
    </Card>
  )
}
