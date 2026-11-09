'use client'

import * as React from 'react'
import { Plus, Trash2, Pencil, CalendarDays, Save, X, Calendar as CalendarIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { EditableDropdown } from '@/components/EditableDropdown'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { parseNumber, formatNumber } from '@/lib/helpers'
import type { Leave, Member } from '@/lib/store'
import { format, parseISO, isValid } from 'date-fns'
import { ar } from 'date-fns/locale'

type Condition = {
  rewardType: string
  base: string // basic | salary | job_wage
  percent: string
  value: string
}

const BASE_LABELS: Record<string, string> = {
  basic: 'الأساسي المربوط',
  salary: 'المرتب',
  job_wage: 'الأجر الوظيفي',
}

// Format ISO date (YYYY-MM-DD) to Arabic display (e.g. "7 نوفمبر 2026")
function formatDateAr(iso: string): string {
  if (!iso) return '-'
  try {
    const d = parseISO(iso)
    if (!isValid(d)) return iso
    return format(d, 'd MMMM yyyy', { locale: ar })
  } catch {
    return iso
  }
}

export function LeavesTab() {
  const { dropdowns } = useStore()
  const [leaves, setLeaves] = React.useState<Leave[]>([])
  const [members, setMembers] = React.useState<Member[]>([])
  const [open, setOpen] = React.useState(false)
  const [editId, setEditId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({
    doctorName: '',
    leaveType: '',
    fromDate: '',
    toDate: '',
    degree: '',
    conditions: [] as Condition[],
    notes: '',
  })

  const load = async () => {
    const r = await fetch('/api/leaves')
    const data = await r.json()
    setLeaves(data)
    // Load members for the doctor dropdown (from data tab - prefer funds, fallback to budget)
    const r2 = await fetch('/api/members?kind=funds')
    const m = await r2.json()
    if (Array.isArray(m) && m.length > 0) {
      setMembers(m)
    } else {
      // fallback to budget members
      const r3 = await fetch('/api/members?kind=budget')
      const m3 = await r3.json()
      setMembers(m3)
    }
  }
  React.useEffect(() => { load() }, [])

  const degrees = dropdowns['degrees'] || []

  const openAdd = () => {
    setForm({
      doctorName: '', leaveType: '', fromDate: '', toDate: '',
      degree: '', conditions: [], notes: '',
    })
    setEditId(null)
    setOpen(true)
  }
  const openEdit = (l: Leave) => {
    let conds: Condition[] = []
    try { conds = JSON.parse(l.conditions || '[]') } catch { conds = [] }
    setForm({
      doctorName: l.doctorName, leaveType: l.leaveType, fromDate: l.fromDate,
      toDate: l.toDate, degree: l.degree, conditions: conds, notes: l.notes,
    })
    setEditId(l.id)
    setOpen(true)
  }

  const save = async () => {
    if (!form.doctorName) { toast.error('اختر اسم الدكتور'); return }
    if (!form.leaveType) { toast.error('اختر نوع الإجازة'); return }
    if (!form.fromDate) { toast.error('اختر تاريخ البداية'); return }
    if (!form.toDate) { toast.error('اختر تاريخ النهاية'); return }
    if (form.fromDate > form.toDate) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية')
      return
    }
    const payload = { ...form, conditions: JSON.stringify(form.conditions) }
    try {
      if (editId) {
        await fetch('/api/leaves', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...payload }),
        })
        toast.success('تم تعديل الإجازة بنجاح')
      } else {
        await fetch('/api/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        toast.success('تمت إضافة الإجازة بنجاح')
      }
      setOpen(false)
      load()
    } catch (e) {
      toast.error('فشل الحفظ: ' + (e as Error).message)
    }
  }
  const del = async (id: string) => {
    if (!confirm('هل تريد حذف هذه الإجازة؟')) return
    try {
      await fetch('/api/leaves', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      toast.success('تم حذف الإجازة')
      load()
    } catch (e) {
      toast.error('فشل الحذف: ' + (e as Error).message)
    }
  }

  const addCondition = () => {
    setForm({
      ...form,
      conditions: [
        ...form.conditions,
        { rewardType: '', base: 'basic', percent: '0', value: '0' },
      ],
    })
  }

  // Update a condition field and recompute value if percent/base changed
  const updCond = (i: number, k: keyof Condition, v: string) => {
    setForm((prev) => {
      const next = [...prev.conditions]
      const cur = { ...next[i], [k]: v }
      // If percent or base changed, recompute the value
      if (k === 'percent' || k === 'base') {
        cur.value = computeValueForMember(members, form.doctorName, cur)
      }
      next[i] = cur
      return { ...prev, conditions: next }
    })
  }

  const delCond = (i: number) => {
    setForm({ ...form, conditions: form.conditions.filter((_, idx) => idx !== i) })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">إجازات أعضاء هيئة التدريس ومعاونيهم</h2>
          <p className="text-muted-foreground">إدارة الإجازات والمكافآت بشروط مرنة</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="ml-2 size-4" /> إضافة إجازة
        </Button>
      </div>

      {members.length === 0 && (
        <div className="border-2 border-amber-300 bg-amber-50 rounded-lg p-4 text-amber-800 text-sm">
          ⚠️ لا يوجد دكاترة في تابة الداتا. يجب إضافة دكاترة أولاً (في تابة الداتا - صناديق خاصة أو موازنة) قبل تسجيل الإجازات.
        </div>
      )}

      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary flex items-center gap-2">
            <CalendarDays className="size-5" /> قائمة الإجازات ({leaves.length})
          </CardTitle>
          <CardDescription>كل الإجازات المسجلة وشروط المكافآت</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary bg-primary/5">
                  <th className="text-right p-2">الدكتور</th>
                  <th className="text-right p-2">نوع الإجازة</th>
                  <th className="text-right p-2">من</th>
                  <th className="text-right p-2">إلى</th>
                  <th className="text-right p-2">الدرجة</th>
                  <th className="text-center p-2">شروط المكافأة</th>
                  <th className="text-center p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-8 text-muted-foreground">لا توجد إجازات مسجلة. اضغط "إضافة إجازة" للبدء.</td></tr>
                )}
                {leaves.map((l) => {
                  let conds: Condition[] = []
                  try { conds = JSON.parse(l.conditions || '[]') } catch { conds = [] }
                  return (
                    <tr key={l.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 font-medium">{l.doctorName}</td>
                      <td className="p-2"><Badge variant="secondary">{l.leaveType}</Badge></td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">{formatDateAr(l.fromDate)}</td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">{formatDateAr(l.toDate)}</td>
                      <td className="p-2">{l.degree}</td>
                      <td className="p-2 text-center text-xs">
                        {conds.length === 0 ? (
                          <span className="text-muted-foreground">لا يوجد</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {conds.map((c, i) => (
                              <span key={i} className="bg-accent/40 px-1.5 py-0.5 rounded">
                                {c.rewardType}: {formatNumber(c.value)} ({c.percent}% {BASE_LABELS[c.base] || c.base})
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(l)} title="تعديل">
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => del(l.id)} title="حذف">
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل إجازة' : 'إضافة إجازة'}</DialogTitle>
            <DialogDescription>أدخل بيانات الإجازة وشروط المكافآت المرنة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">اسم الدكتور (من تابة الداتا)</Label>
                <Select value={form.doctorName} onValueChange={(v) => setForm({ ...form, doctorName: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الدكتور" /></SelectTrigger>
                  <SelectContent>
                    {members.map((m) => (
                      <SelectItem key={m.id || m.code} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block">نوع الإجازة (قائمة منسدلة)</Label>
                <EditableDropdown
                  dropdownKey="leave_types"
                  value={form.leaveType}
                  onChange={(v) => setForm({ ...form, leaveType: v })}
                  placeholder="اختر نوع الإجازة"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">من تاريخ</Label>
                <DatePicker
                  value={form.fromDate}
                  onChange={(v) => setForm({ ...form, fromDate: v })}
                  placeholder="اختر تاريخ البداية"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">إلى تاريخ</Label>
                <DatePicker
                  value={form.toDate}
                  onChange={(v) => setForm({ ...form, toDate: v })}
                  placeholder="اختر تاريخ النهاية"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">الدرجة (قائمة منسدلة)</Label>
                <EditableDropdown
                  dropdownKey="degrees"
                  value={form.degree}
                  onChange={(v) => setForm({ ...form, degree: v })}
                  placeholder="اختر الدرجة"
                />
              </div>
            </div>

            {/* شروط المكافأة */}
            <div className="border rounded-md p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">شروط المكافآت (يمكن إضافة أكثر من شرط)</Label>
                <Button size="sm" onClick={addCondition}>
                  <Plus className="size-4 ml-1" /> إضافة شرط
                </Button>
              </div>
              {form.conditions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">لم تتم إضافة شروط بعد. اضغط "إضافة شرط" لإضافة شرط مكافأة.</p>
              )}
              <div className="space-y-2">
                {form.conditions.map((c, i) => {
                  const computed = computeValueForMember(members, form.doctorName, c)
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-card">
                      <div className="col-span-3">
                        <Label className="text-xs">نوع المكافأة</Label>
                        <EditableDropdown
                          dropdownKey="reward_types"
                          value={c.rewardType}
                          onChange={(v) => updCond(i, 'rewardType', v)}
                          placeholder="اختر"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">من</Label>
                        <Select
                          value={c.base}
                          onValueChange={(v) => updCond(i, 'base', v)}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">الأساسي المربوط</SelectItem>
                            <SelectItem value="salary">المرتب</SelectItem>
                            <SelectItem value="job_wage">الأجر الوظيفي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">النسبة %</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={c.percent}
                          onChange={(e) => updCond(i, 'percent', e.target.value)}
                          className="h-9"
                          placeholder="0"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">القيمة المحسوبة</Label>
                        <Input
                          value={computed}
                          onChange={(e) => updCond(i, 'value', e.target.value)}
                          className="h-9 bg-muted/40 font-bold"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button size="icon" variant="ghost" onClick={() => delCond(i)} title="حذف الشرط">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * القيمة تُحسب تلقائيًا = النسبة% × قيمة "الأساسي المربوط" للدكتور (من تابة الداتا). يمكنك تعديلها يدويًا.
              </p>
            </div>

            <div>
              <Label className="mb-1.5 block">ملاحظات</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="ملاحظات إضافية..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
            <Button onClick={save}><Save className="size-4 ml-1" /> حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------- Date Picker Component (clearer than native date input) ----------
function DatePicker({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parseISO(value) : undefined
  const validSelected = selected && isValid(selected) ? selected : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-right font-normal h-10"
        >
          <CalendarIcon className="ml-2 size-4 text-muted-foreground" />
          {validSelected ? (
            <span>{format(validSelected, 'd MMMM yyyy', { locale: ar })}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder || 'اختر التاريخ'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validSelected}
          onSelect={(d) => {
            if (d) {
              const iso = format(d, 'yyyy-MM-dd')
              onChange(iso)
              setOpen(false)
            }
          }}
          locale={ar}
          dir="rtl"
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ---------- Helper: compute the value of a condition ----------
function computeValueForMember(members: Member[], doctorName: string, c: Condition): string {
  if (!doctorName) return '0'
  const member = members.find((m) => m.name === doctorName)
  if (!member) return '0'
  let base = 0
  if (c.base === 'basic') base = parseNumber(member.basic) || parseNumber(member.basicSalary)
  else if (c.base === 'salary') base = parseNumber(member.basic) || parseNumber(member.basicSalary) // simplified
  else if (c.base === 'job_wage') base = parseNumber(member.basic) || parseNumber(member.basicSalary) // simplified
  const pct = parseNumber(c.percent) / 100
  const val = base * pct
  return val.toFixed(2)
}
