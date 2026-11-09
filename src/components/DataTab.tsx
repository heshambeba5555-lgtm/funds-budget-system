'use client'

import * as React from 'react'
import { Upload, Download, Plus, Trash2, Save, Printer, FileSpreadsheet, Columns3, X, FileDown, Eraser, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { EditableDropdown } from '@/components/EditableDropdown'
import { toast } from 'sonner'
import { ReportHeader } from '@/components/ReportHeader'
import { SignaturesRow } from '@/components/SignaturesRow'
import { parseNumber, formatNumber, genId } from '@/lib/helpers'
import { useStore } from '@/lib/store'
import type { Member, ColumnDef, Reward } from '@/lib/store'

// Arabic month names (matching settings)
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

const FUNDS_COLS = [
  { key: 'serial', header: 'م', type: 'text' },
  { key: 'code', header: 'رمزه م', type: 'text' },
  { key: 'basic', header: 'الأساسي', type: 'number' },
  { key: 'bound', header: 'المربوط', type: 'number' },
  { key: 'exchangeNo', header: 'رقم الصرف', type: 'text' },
  { key: 'name', header: 'الاسم', type: 'text' },
  { key: 'administration', header: 'الإدارة', type: 'dropdown' },
  { key: 'degree', header: 'الدرجة', type: 'dropdown' },
  { key: 'job', header: 'الوظيفة', type: 'dropdown' },
  { key: 'nationalId', header: 'الرقم القومي', type: 'text' },
  { key: 'qualityReward', header: 'مكافأة الجودة', type: 'number' },
  { key: 'extraHours', header: 'الساعات الزائدة', type: 'number' },
  { key: 'diff90', header: 'فروق 90 يوم', type: 'number' },
  { key: 'total', header: 'الإجمالي', type: 'number' },
] as const

const BUDGET_COLS = [
  { key: 'code', header: 'م', type: 'text' },
  { key: 'basic', header: 'الأساسي', type: 'number' },
  { key: 'bound', header: 'المربوط', type: 'number' },
  { key: 'exchangeNo', header: 'رقم الصرف', type: 'text' },
  { key: 'name', header: 'الاسم', type: 'text' },
  { key: 'administration', header: 'الإدارة', type: 'dropdown' },
  { key: 'degree', header: 'الدرجة', type: 'dropdown' },
  { key: 'job', header: 'الوظيفة', type: 'dropdown' },
  { key: 'nationalId', header: 'الرقم القومي', type: 'text' },
  { key: 'teachingReward', header: 'مكافأة تدريس', type: 'number' },
  { key: 'percent200', header: 'الـ 200%', type: 'number' },
  { key: 'total', header: 'الإجمالي', type: 'number' },
] as const

const DROPDOWN_KEYS: Record<string, string> = {
  administration: 'administrations',
  degree: 'degrees',
  job: 'jobs',
}

export function DataTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">تابة الداتا</h2>
        <p className="text-muted-foreground">استيراد/تصدير Excel - إضافة أعمدة وصفوف - تعديل وحذف</p>
      </div>
      <Tabs defaultValue="funds">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="funds">صناديق خاصة</TabsTrigger>
          <TabsTrigger value="budget">الموازنة</TabsTrigger>
        </TabsList>
        <TabsContent value="funds">
          <SheetEditor kind="funds" cols={FUNDS_COLS as unknown as { key: string; header: string; type: string }[]} reportTitle="صناديق خاصة أعضاء هيئة التدريس ومعاونيهم" />
        </TabsContent>
        <TabsContent value="budget">
          <SheetEditor kind="budget" cols={BUDGET_COLS as unknown as { key: string; header: string; type: string }[]} reportTitle="موازنة أعضاء هيئة التدريس ومعاونيهم" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

type SheetCol = { key: string; header: string; type: string }

function SheetEditor({ kind, cols, reportTitle }: { kind: 'funds' | 'budget'; cols: SheetCol[]; reportTitle: string }) {
  const [rows, setRows] = React.useState<Member[]>([])
  const [extraCols, setExtraCols] = React.useState<ColumnDef[]>([])
  const [printing, setPrinting] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [showAddCol, setShowAddCol] = React.useState(false)
  const [newCol, setNewCol] = React.useState({ label: '', type: 'text' })
  // Hidden columns: built-in column keys hidden from view (data is kept in DB)
  const [hiddenCols, setHiddenCols] = React.useState<string[]>([])
  const [showManageCols, setShowManageCols] = React.useState(false)
  const [showDelCol, setShowDelCol] = React.useState(false)
  // Rewards & Leaves for validation
  const [rewards, setRewards] = React.useState<Reward[]>([])
  const [leaves, setLeaves] = React.useState<{ doctorName: string; fromDate: string; toDate: string; leaveType: string }[]>([])

  const load = async () => {
    const r = await fetch(`/api/members?kind=${kind}`)
    const data = await r.json()
    setRows(data)
    const r2 = await fetch(`/api/columns?kind=${kind}`)
    const cols = await r2.json()
    setExtraCols(cols)
    // Load rewards for validation
    const r3 = await fetch('/api/rewards')
    const rewardsData = await r3.json()
    setRewards(rewardsData)
    // Load leaves to check who is on leave
    const r4 = await fetch('/api/leaves')
    const leavesData = await r4.json()
    setLeaves(leavesData.map((l: { doctorName: string; fromDate: string; toDate: string; leaveType: string }) => ({
      doctorName: l.doctorName, fromDate: l.fromDate, toDate: l.toDate, leaveType: l.leaveType || '',
    })))
  }
  React.useEffect(() => { load() }, [kind])

  // Forfeiting leave types from settings (default to ["بدون مرتب"])
  const forfeitingLeaveTypes: string[] = (() => {
    try { return JSON.parse(setting?.forfeitingLeaveTypes || '["بدون مرتب"]') as string[] } catch { return ['بدون مرتب'] }
  })()

  // Check if a member is on a FORFEITING leave (i.e. should be denied rewards)
  // Returns the leave details if matched, or null
  const getForfeitingLeave = (member: Member): { leaveType: string; fromDate: string; toDate: string } | null => {
    if (!setting?.month) return null
    const memberName = member.name || ''
    if (!memberName) return null
    const memberLeaves = leaves.filter((l) => l.doctorName === memberName)
    if (memberLeaves.length === 0) return null
    const monthIdx = MONTH_NAMES.indexOf(setting.month)
    if (monthIdx < 0) return null
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
          // Overlapping leave found - check if it's a forfeiting type
          if (forfeitingLeaveTypes.includes(l.leaveType)) {
            return { leaveType: l.leaveType, fromDate: l.fromDate, toDate: l.toDate }
          }
        }
      }
    }
    return null
  }

  // Check if a member is on leave based on the current month setting
  // We use the setting's month/year to determine the period
  // Check both possible years (e.g., academic year 2025/2026 → check Nov 2025 AND Nov 2026)
  const { setting } = useStore()
  const checkOnLeave = (member: Member): boolean => {
    if (!setting?.month) return false
    const memberName = member.name || ''
    if (!memberName) return false
    const memberLeaves = leaves.filter((l) => l.doctorName === memberName)
    if (memberLeaves.length === 0) return false
    // Determine the period: month + academic year
    const monthIdx = MONTH_NAMES.indexOf(setting.month)
    if (monthIdx < 0) return false
    // Get academic year start (e.g., "2025/2026" → 2025)
    const yearMatch = setting.academicYear?.match(/^(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()
    // Academic year spans two calendar years; for an academic year like "2025/2026"
    // check both 2025 and 2026 for any month to be safe
    const yearsToCheck = [year, year + 1]
    for (const periodYear of yearsToCheck) {
      const periodStart = new Date(periodYear, monthIdx, 1)
      const periodEnd = new Date(periodYear, monthIdx + 1, 0, 23, 59, 59)
      for (const l of memberLeaves) {
        if (!l.fromDate || !l.toDate) continue
        const from = new Date(l.fromDate)
        const to = new Date(l.toDate)
        if (from <= periodEnd && to >= periodStart) {
          return true
        }
      }
    }
    return false
  }

  // Get the expected reward value for a member + category
  // Returns null if no rule defined (no validation needed)
  const getExpectedReward = (member: Member, category: string): number | null => {
    if (rewards.length === 0) return null
    // Try matching by degree first, then job
    const findBy = (type: 'degree' | 'job', name: string) => {
      if (!name) return null
      return rewards.find((r) => r.type === type && r.name === name && r.category === category)
    }
    const rule = findBy('degree', member.degree) || findBy('job', member.job)
    if (!rule) return null
    if (rule.rewardType === 'fixed') {
      return parseNumber(rule.amount)
    }
    // percent: from basic (or bound) - use basic first, fallback to basicSalary
    const basic = parseNumber(member.basic) || parseNumber(member.basicSalary)
    const pct = parseNumber(rule.amount) / 100
    return basic * pct
  }

  // Map column key → reward category
  const COL_TO_CATEGORY: Record<string, string> = {
    qualityReward: 'quality',
    teachingReward: 'teaching',
    extraHours: 'extra_hours',
    diff90: 'diff_90',
    percent200: 'percent_200',
  }

  // Check if a value matches the expected reward
  const isValueMismatched = (member: Member, colKey: string, value: string): boolean => {
    const category = COL_TO_CATEGORY[colKey]
    if (!category) return false
    const expected = getExpectedReward(member, category)
    if (expected === null) return false
    const actual = parseNumber(value)
    // Allow tolerance of 0.01
    if (Math.abs(expected - actual) < 0.01) return false
    return true
  }

  const newRow = (): Member => ({
    kind,
    serial: String(rows.length + 1),
    code: '',
    basic: '',
    bound: '',
    basicSalary: '',
    exchangeNo: '',
    name: '',
    administration: '',
    degree: '',
    job: '',
    nationalId: '',
    qualityReward: '',
    extraHours: '',
    diff90: '',
    teachingReward: '',
    percent200: '',
    total: '',
    extraColumns: '{}',
    order: rows.length,
  })

  const upd = (idx: number, key: string, value: string) => {
    setRows((prev) => {
      const next = [...prev]
      // Compute total if relevant
      const r = { ...next[idx], [key]: value } as Member
      // Keep basicSalary in sync with basic+bound for backward compat
      if (key === 'basic' || key === 'bound') {
        const b = key === 'basic' ? value : r.basic
        const n = key === 'bound' ? value : r.bound
        r.basicSalary = b && n ? `${b}+${n}` : (b || n)
      }
      if (['basic', 'bound', 'qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200'].includes(key)) {
        r.total = computeTotal(r, kind).toString()
      }
      next[idx] = r
      return next
    })
  }

  const updExtra = (idx: number, colKey: string, value: string) => {
    setRows((prev) => {
      const next = [...prev]
      const r = { ...next[idx] }
      let extra: Record<string, string> = {}
      try { extra = JSON.parse(r.extraColumns || '{}') } catch { extra = {} }
      extra[colKey] = value
      r.extraColumns = JSON.stringify(extra)
      next[idx] = r
      return next
    })
  }

  const saveAll = async () => {
    const r = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, items: rows.map((r, i) => ({ ...r, order: i })) }),
    })
    const j = await r.json()
    if (j.ok) {
      toast.success(`تم حفظ ${j.count} صف`)
      load()
    } else {
      toast.error('فشل الحفظ')
    }
  }

  const delRow = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('kind', kind)
    toast.info('جارٍ الاستيراد...')
    const r = await fetch('/api/excel/import', { method: 'POST', body: fd })
    const j = await r.json()
    if (j.ok) {
      toast.success(`تم استيراد ${j.count} صف`)
      load()
    } else {
      toast.error(j.error || 'فشل الاستيراد')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const exportExcel = () => {
    window.open(`/api/excel/export?kind=${kind}`, '_blank')
  }

  const addColumn = async () => {
    if (!newCol.label.trim()) { toast.error('أدخل اسم العمود'); return }
    const key = genId()
    const r = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        key,
        label: newCol.label.trim(),
        type: newCol.type,
        order: extraCols.length,
      }),
    })
    const c = await r.json()
    setExtraCols([...extraCols, c])
    setNewCol({ label: '', type: 'text' })
    setShowAddCol(false)
    toast.success('تم إضافة العمود')
  }

  const delColumn = async (id: string) => {
    if (!confirm('حذف هذا العمود من جميع الصفوف؟')) return
    await fetch('/api/columns', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setExtraCols(extraCols.filter((c) => c.id !== id))
    toast.success('تم حذف العمود')
  }

  const print = () => {
    setPrinting(true)
    setTimeout(() => {
      window.print()
      setPrinting(false)
    }, 200)
  }

  const downloadTemplate = () => {
    window.open(`/api/excel/template?kind=${kind}`, '_blank')
    toast.success(`جارٍ تنزيل قالب ${kind === 'funds' ? 'صناديق خاصة' : 'الموازنة'}...`)
  }

  const clearAll = async () => {
    if (rows.length === 0) {
      toast.info('لا توجد بيانات لمسحها')
      return
    }
    if (!confirm(`هل أنت متأكد من مسح جميع البيانات (${rows.length} صف)؟\nسيتم حذف كل الصفوف من الشيت. لا يمكن التراجع.`)) {
      return
    }
    // Clear locally
    setRows([])
    // Also clear in DB
    try {
      await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      })
      toast.success(`تم مسح جميع البيانات (${rows.length} صف)`)
    } catch (e) {
      toast.error('فشل المسح: ' + (e as Error).message)
    }
  }

  const totalRow = () => {
    const t: Record<string, number> = {}
    for (const c of cols) {
      if (c.type === 'number') {
        // Exclude forfeited rows (those with forfeiting leave) from the totals
        t[c.key] = rows.reduce((s, r) => {
          // For reward columns, exclude forfeited rows
          const isForfeited = !!getForfeitingLeave(r)
          const isRewardCol = !!COL_TO_CATEGORY[c.key]
          if (isForfeited && isRewardCol) {
            // Skip this row's value (count as 0)
            return s
          }
          // For the total column, if the row is forfeited, count its total as 0 too
          if (isForfeited && c.key === 'total') {
            return s
          }
          return s + parseNumber((r as Record<string, unknown>)[c.key] as string)
        }, 0)
      }
    }
    return t
  }
  const totals = totalRow()

  const allColsRaw = [...cols, ...extraCols.map((c) => ({ key: `extra_${c.key}`, header: c.label, type: c.type }))]
  const allCols = allColsRaw.filter((c) => !hiddenCols.includes(c.key))

  return (
    <div className="space-y-4">
      {/* Action bar - hidden when printing */}
      <div className="no-print flex flex-wrap gap-2 items-center justify-between p-3 bg-muted/30 rounded-lg">
        <div className="flex flex-wrap gap-2">
          <Button onClick={addRow} variant="default" size="sm">
            <Plus className="size-4 ml-1" /> صف جديد
          </Button>
          <Button onClick={() => setShowAddCol(!showAddCol)} variant="outline" size="sm">
            <Columns3 className="size-4 ml-1" /> عمود جديد
          </Button>
          <Button onClick={() => setShowDelCol(!showDelCol)} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            <Trash2 className="size-4 ml-1" /> حذف عمود
          </Button>
          <Button onClick={() => setShowManageCols(true)} variant="outline" size="sm">
            <EyeOff className="size-4 ml-1" /> إخفاء/إظهار
            {hiddenCols.length > 0 && (
              <span className="mr-1 bg-primary text-primary-foreground rounded-full size-4 inline-flex items-center justify-center text-[10px]">
                {hiddenCols.length}
              </span>
            )}
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-3 rounded-md text-sm">
              <Upload className="size-4" /> استيراد Excel
            </span>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importExcel} />
          </label>
          <Button onClick={exportExcel} variant="outline" size="sm">
            <Download className="size-4 ml-1" /> تصدير Excel
          </Button>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <FileDown className="size-4 ml-1" /> تنزيل قالب فارغ
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
            <Eraser className="size-4 ml-1" /> مسح الكل
          </Button>
          <Button onClick={print} variant="outline" size="sm">
            <Printer className="size-4 ml-1" /> طباعة
          </Button>
        </div>
        <Button onClick={saveAll} variant="default" size="sm" className="bg-primary">
          <Save className="size-4 ml-1" /> حفظ الكل
        </Button>
      </div>

      {showAddCol && (
        <Card className="no-print">
          <CardContent className="pt-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>اسم العمود</Label>
                <Input value={newCol.label} onChange={(e) => setNewCol({ ...newCol, label: e.target.value })} />
              </div>
              <div>
                <Label>النوع</Label>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={newCol.type}
                  onChange={(e) => setNewCol({ ...newCol, type: e.target.value })}
                >
                  <option value="text">نص</option>
                  <option value="number">رقم</option>
                </select>
              </div>
              <Button onClick={addColumn}>إضافة</Button>
              <Button variant="ghost" onClick={() => setShowAddCol(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نافذة حذف عمود */}
      {showDelCol && (
        <Card className="no-print border-destructive/30">
          <CardHeader className="bg-destructive/5 pb-3">
            <CardTitle className="text-destructive text-base flex items-center gap-2">
              <Trash2 className="size-4" /> حذف عمود
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Label className="mb-2 block">اختر العمود الذي تريد حذفه:</Label>
            <div className="border rounded-md max-h-60 overflow-y-auto divide-y">
              {allColsRaw.map((c) => {
                const isExtra = c.key.startsWith('extra_')
                const isHidden = hiddenCols.includes(c.key)
                return (
                  <div
                    key={c.key}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.header}</span>
                      <Badge variant="outline" className="text-xs">
                        {isExtra ? 'إضافي' : 'أساسي'}
                      </Badge>
                      {isHidden && <Badge variant="secondary" className="text-xs">مخفي</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        if (isExtra) {
                          // حذف عمود إضافي نهائياً
                          if (!confirm(`حذف العمود "${c.header}" نهائيًا؟ سيتم حذف بياناته من جميع الصفوف.`)) return
                          const ecId = extraCols.find((ec) => `extra_${ec.key}` === c.key)?.id || ''
                          if (ecId) {
                            await delColumn(ecId)
                            setHiddenCols(hiddenCols.filter((k) => k !== c.key))
                          }
                        } else {
                          // حذف عمود أساسي: مسح القيم من جميع الصفوف + إخفاؤه
                          if (!confirm(`حذف قيم العمود "${c.header}" من جميع الصفوف وإخفاؤه؟`)) return
                          const baseKey = c.key
                          setRows((prev) => prev.map((r) => {
                            const updated = { ...r, [baseKey]: '' }
                            if (baseKey === 'basic' || baseKey === 'bound') {
                              const b = baseKey === 'basic' ? '' : r.basic
                              const n = baseKey === 'bound' ? '' : r.bound
                              updated.basicSalary = b && n ? `${b}+${n}` : (b || n)
                            }
                            if (['qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200'].includes(baseKey)) {
                              updated.total = computeTotal(updated, kind).toString()
                            }
                            return updated
                          }))
                          setHiddenCols([...hiddenCols.filter((k) => k !== c.key), c.key])
                          toast.success(`تم حذف قيم العمود "${c.header}" وإخفاؤه`)
                        }
                      }}
                    >
                      <Trash2 className="size-3 ml-1" /> حذف
                    </Button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-end mt-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDelCol(false)}>إغلاق</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نافذة إدارة الأعمدة - إخفاء/إظهار */}
      <Dialog open={showManageCols} onOpenChange={setShowManageCols}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <EyeOff className="size-5" /> إدارة الأعمدة - إخفاء/إظهار/حذف
            </DialogTitle>
            <DialogDescription>
              أخفِ أي عمود من العرض (تبقى البيانات محفوظة) أو احذف العمود نهائيًا (يتم حذف بياناته من جميع الصفوف).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {allColsRaw.map((c) => {
              const isHidden = hiddenCols.includes(c.key)
              const isExtra = c.key.startsWith('extra_')
              return (
                <div
                  key={c.key}
                  className={`flex items-center gap-3 border rounded-md p-2 ${isHidden ? 'bg-muted/40 opacity-60' : 'bg-card'}`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{c.header}</div>
                    <div className="text-xs text-muted-foreground">
                      {isExtra ? 'عمود إضافي' : 'عمود أساسي'} - نوع: {c.type === 'number' ? 'رقم' : c.type === 'dropdown' ? 'قائمة' : 'نص'}
                      {isHidden && ' (مخفي)'}
                    </div>
                  </div>
                  {isHidden ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHiddenCols(hiddenCols.filter((k) => k !== c.key))}
                    >
                      <Eye className="size-4 ml-1" /> إظهار
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHiddenCols([...hiddenCols, c.key])}
                    >
                      <EyeOff className="size-4 ml-1" /> إخفاء
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      const msg = isExtra
                        ? `حذف العمود "${c.header}" نهائيًا؟ سيتم حذف بياناته من جميع الصفوف.`
                        : `حذف العمود الأساسي "${c.header}" نهائيًا؟ سيتم حذف كل قيمه من جميع الصفوف (لا يمكن التراجع).\nملاحظة: يمكن إعادة إظهاره لاحقًا من قائمة "إظهار الكل" إذا كان مخفيًا، لكن البيانات المحذوفة لا تستعيد.`
                      if (!confirm(msg)) return
                      if (isExtra) {
                        const ecId = extraCols.find((ec) => `extra_${ec.key}` === c.key)?.id || ''
                        if (ecId) {
                          await delColumn(ecId)
                          setHiddenCols(hiddenCols.filter((k) => k !== c.key))
                        }
                      } else {
                        // حذف نهائي لعمود أساسي: مسح القيم من جميع الصفوف محليًا
                        const baseKey = c.key
                        setRows((prev) => prev.map((r) => {
                          if (baseKey === 'basic' || baseKey === 'bound') {
                            const updated = { ...r, [baseKey]: '' }
                            // Recompute basicSalary if either basic or bound is cleared
                            const b = baseKey === 'basic' ? '' : r.basic
                            const n = baseKey === 'bound' ? '' : r.bound
                            updated.basicSalary = b && n ? `${b}+${n}` : (b || n)
                            updated.total = computeTotal(updated, kind).toString()
                            return updated
                          }
                          const updated = { ...r, [baseKey]: '' }
                          // Recompute total if it's a reward column
                          if (['qualityReward', 'extraHours', 'diff90', 'teachingReward', 'percent200'].includes(baseKey)) {
                            updated.total = computeTotal(updated, kind).toString()
                          }
                          return updated
                        }))
                        setHiddenCols([...hiddenCols.filter((k) => k !== c.key), c.key])
                        toast.success(`تم حذف قيم العمود "${c.header}" نهائيًا من جميع الصفوف`)
                      }
                    }}
                  >
                    <Trash2 className="size-4 ml-1" /> حذف نهائي
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-3 mt-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              إجمالي الأعمدة: {allColsRaw.length} - ظاهر: {allColsRaw.length - hiddenCols.length} - مخفي: {hiddenCols.length}
            </div>
            <div className="flex gap-2">
              {hiddenCols.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setHiddenCols([])}>
                  <Eye className="size-4 ml-1" /> إظهار الكل
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowManageCols(false)}>
                تم
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* The printable sheet */}
      <Card className="overflow-hidden">
        <ReportHeader reportName={reportTitle} />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="border border-primary-foreground/30 p-2 text-center sticky right-0 bg-primary z-10">#</th>
                  {allCols.map((c) => (
                    <th key={c.key} className="border border-primary-foreground/30 p-2 text-center min-w-28">
                      <div className="flex items-center justify-center gap-1">
                        {c.header}
                        {c.key.startsWith('extra_') && (
                          <button
                            onClick={() => delColumn(extraCols.find((ec) => `extra_${ec.key}` === c.key)?.id || '')}
                            className="hover:text-destructive-foreground"
                            title="حذف العمود"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="border border-primary-foreground/30 p-2 text-center no-print">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={allCols.length + 2} className="text-center p-8 text-muted-foreground">
                      لا توجد بيانات. اضغط "صف جديد" أو استورد من Excel.
                    </td>
                  </tr>
                )}
                {rows.map((r, idx) => {
                  const onLeave = checkOnLeave(r)
                  const forfeitingLeave = getForfeitingLeave(r)
                  // If on forfeiting leave, the displayed reward values are zeroed out
                  // (the actual stored value is kept; only displayed/cleared in view)
                  const isForfeited = !!forfeitingLeave
                  // Reward columns get special treatment when on leave
                  const isRewardCol = (k: string) => !!COL_TO_CATEGORY[k]
                  return (
                    <tr
                      key={r.id || idx}
                      className={isForfeited
                        ? 'bg-red-50 border-r-4 border-red-500'
                        : onLeave
                          ? 'bg-amber-50/60 border-r-4 border-amber-500'
                          : (idx % 2 === 0 ? 'bg-card' : 'bg-muted/20')
                      }
                    >
                      <td className="border p-1 text-center sticky right-0 bg-inherit z-10">
                        {idx + 1}
                        {isForfeited && (
                          <span title={`محروم من المكافآت (${forfeitingLeave.leaveType})`} className="text-red-600 mr-0.5">⛔</span>
                        )}
                        {!isForfeited && onLeave && (
                          <span title="في إجازة - لا يستحق مكافأة" className="text-amber-600 mr-0.5">⚠</span>
                        )}
                      </td>
                      {allCols.map((c) => {
                        const baseKey = c.key.replace(/^extra_/, '')
                        const isExtra = c.key.startsWith('extra_')
                        let value = ''
                        if (isExtra) {
                          try {
                            const extra = JSON.parse(r.extraColumns || '{}')
                            value = extra[baseKey] || ''
                          } catch { value = '' }
                        } else {
                          value = (r as Record<string, unknown>)[c.key] as string || ''
                        }
                        // For forfeited rows: display reward columns as 0 (visually)
                        const isReward = !isExtra && isRewardCol(c.key)
                        if (isForfeited && isReward) {
                          value = '0'
                        }
                        // For forfeited rows: also display total as 0
                        if (isForfeited && c.key === 'total') {
                          value = '0'
                        }
                        // Check if this is a reward column with mismatched value
                        const mismatched = !isExtra && !isForfeited && isValueMismatched(r, c.key, value)
                        // If on leave (non-forfeiting) and reward column, mark cell
                        const rewardCell = !isExtra && isRewardCol(c.key)
                        if (c.type === 'dropdown' && DROPDOWN_KEYS[baseKey]) {
                          return (
                            <td key={c.key} className="border p-1">
                              <EditableDropdown
                                dropdownKey={DROPDOWN_KEYS[baseKey]}
                                value={value}
                                onChange={(v) => isExtra ? updExtra(idx, baseKey, v) : upd(idx, baseKey, v)}
                                placeholder="-"
                                className="h-8 min-w-24"
                              />
                            </td>
                          )
                        }
                        // Compute cell styling
                        let cellClass = 'w-full h-8 px-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-background rounded'
                        let title = ''
                        if (isForfeited && isReward) {
                          cellClass = 'w-full h-8 px-2 bg-red-200 text-red-900 font-bold text-sm line-through focus:outline-none focus:ring-2 focus:ring-red-500/60 rounded cursor-not-allowed'
                          title = `محروم من المكافأة - إجازة ${forfeitingLeave!.leaveType} من ${forfeitingLeave!.fromDate} إلى ${forfeitingLeave!.toDate}`
                        } else if (mismatched) {
                          cellClass = 'w-full h-8 px-2 bg-red-100 text-red-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-red-500/60 rounded'
                          const expected = getExpectedReward(r, COL_TO_CATEGORY[c.key])
                          title = `القيمة المتوقعة: ${formatNumber(expected ?? 0)} - القيمة الحالية لا تطابق المكافأة المسجلة في الإعدادات`
                        } else if (onLeave && rewardCell) {
                          cellClass = 'w-full h-8 px-2 bg-amber-100 text-amber-700 text-sm line-through focus:outline-none focus:ring-2 focus:ring-amber-500/60 rounded'
                          title = 'الدكتور في إجازة - لا يستحق هذه المكافأة'
                        }
                        return (
                          <td
                            key={c.key}
                            className={`border p-1 ${
                              isForfeited && isReward ? 'bg-red-200'
                              : mismatched ? 'bg-red-50'
                              : (onLeave && rewardCell ? 'bg-amber-50' : '')
                            }`}
                          >
                            <input
                              type={c.type === 'number' ? 'number' : 'text'}
                              value={value}
                              title={title}
                              onChange={(e) => isExtra ? updExtra(idx, baseKey, e.target.value) : upd(idx, baseKey, e.target.value)}
                              className={cellClass}
                            />
                            {mismatched && (
                              <AlertCircle className="size-3 text-red-600 inline mr-1" />
                            )}
                          </td>
                        )
                      })}
                      <td className="border p-1 text-center no-print">
                        <Button size="icon" variant="ghost" onClick={() => delRow(idx)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-accent/60 font-bold">
                    <td className="border p-2 text-center sticky right-0 bg-accent z-10">الإجمالي</td>
                    {allCols.map((c) => (
                      <td key={c.key} className="border p-2 text-center">
                        {c.type === 'number' ? formatNumber(totals[c.key.replace(/^extra_/, '')] || 0) : ''}
                      </td>
                    ))}
                    <td className="border p-2 no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
        {/* التوقيعات تحت الشيت */}
        <SignaturesRow />
        <div className="no-print p-2 bg-muted/30 border-t text-xs text-muted-foreground text-center">
          عدد الصفوف: {rows.length} - التصميم: أ. هشام محمد عيد عبد السلام
        </div>
      </Card>

      <div className="no-print flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1 bg-muted/40 px-3 py-1.5 rounded">
          <FileSpreadsheet className="size-4 text-primary" />
          <span>قالب Excel للاستيراد: استخدم نفس رؤوس الأعمدة الظاهرة بالأعلى.</span>
        </div>
      </div>

    </div>
  )
}

function computeTotal(r: Member, kind: 'funds' | 'budget'): number {
  if (kind === 'funds') {
    return parseNumber(r.qualityReward) + parseNumber(r.extraHours) + parseNumber(r.diff90)
  }
  return parseNumber(r.teachingReward) + parseNumber(r.percent200)
}
