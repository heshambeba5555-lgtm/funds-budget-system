'use client'

import * as React from 'react'
import { Save, Upload, Trash2, Image as ImageIcon, Plus, Pencil, Check, X, PenLine, Coins, Ban } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { EditableDropdown } from '@/components/EditableDropdown'
import { useStore, type Signature, type Setting, type Reward } from '@/lib/store'
import { parseNumber, formatNumber } from '@/lib/helpers'
import { toast } from 'sonner'

const MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
]

export function SettingsTab() {
  const { setting, saveSetting, dropdowns } = useStore()
  const [form, setForm] = React.useState(setting)
  React.useEffect(() => setForm(setting), [setting])

  if (!form) return null

  const upd = (k: keyof typeof form, v: string) => setForm({ ...form, [k]: v })

  const handleLogo = (k: 'universityLogo' | 'facultyLogo') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      upd(k, String(reader.result))
      toast.success('تم تحميل الشعار')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">الإعدادات العامة</h2>
          <p className="text-muted-foreground">بيانات الكلية والشعارات والترويسة</p>
        </div>
        <Button
          onClick={async () => {
            await saveSetting(form)
            toast.success('تم حفظ الإعدادات بنجاح')
          }}
          size="lg"
        >
          <Save className="ml-2 size-4" /> حفظ الإعدادات
        </Button>
      </div>

      {/* بيانات الكلية والجامعة */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">بيانات الجامعة والكلية</CardTitle>
          <CardDescription>المعلومات الأساسية للجامعة والكلية والمسؤولين</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <div>
            <Label>اسم الجامعة</Label>
            <Input value={form.universityName} onChange={(e) => upd('universityName', e.target.value)} />
          </div>
          <div>
            <Label>اسم الكلية</Label>
            <Input value={form.facultyName} onChange={(e) => upd('facultyName', e.target.value)} />
          </div>
          <div>
            <Label>اسم عميد الكلية</Label>
            <Input value={form.deanName} onChange={(e) => upd('deanName', e.target.value)} />
          </div>
          <div>
            <Label>اسم مدير الكلية</Label>
            <Input value={form.directorName} onChange={(e) => upd('directorName', e.target.value)} />
          </div>
          <div>
            <Label>اسم مساعد مدير الكلية</Label>
            <Input value={form.assistantDirectorName} onChange={(e) => upd('assistantDirectorName', e.target.value)} />
          </div>
          <div>
            <Label>اسم مسئول الكادر (قائمة)</Label>
            <EditableDropdown
              dropdownKey="cadre_officers"
              value={form.cadreOfficerName}
              onChange={(v) => upd('cadreOfficerName', v)}
              placeholder="اختر مسئول الكادر"
            />
          </div>
          <div>
            <Label>اسم الإدارة (قائمة)</Label>
            <EditableDropdown
              dropdownKey="administrations"
              value={form.administrationName}
              onChange={(v) => upd('administrationName', v)}
              placeholder="اختر الإدارة"
            />
          </div>
          <div>
            <Label>الوظيفة (قائمة)</Label>
            <EditableDropdown
              dropdownKey="jobs"
              value={form.jobName}
              onChange={(v) => upd('jobName', v)}
              placeholder="اختر الوظيفة"
            />
          </div>
          <div>
            <Label>الدرجة (قائمة)</Label>
            <EditableDropdown
              dropdownKey="degrees"
              value={form.degreeName}
              onChange={(v) => upd('degreeName', v)}
              placeholder="اختر الدرجة"
            />
          </div>
          <div>
            <Label>اسم مسئول الشئون المالية</Label>
            <Input value={form.financialAffairsOfficerName} onChange={(e) => upd('financialAffairsOfficerName', e.target.value)} />
          </div>
          <div>
            <Label>العام</Label>
            <Input value={form.academicYear} onChange={(e) => upd('academicYear', e.target.value)} placeholder="2025/2026" />
          </div>
          <div>
            <Label>الشهر</Label>
            <select
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={form.month}
              onChange={(e) => upd('month', e.target.value)}
            >
              <option value="">اختر الشهر</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <Label>اليوم</Label>
            <Input value={form.day} onChange={(e) => upd('day', e.target.value)} placeholder="مثال: الأحد" />
          </div>
        </CardContent>
      </Card>

      {/* الشعارات */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">شعار الجامعة والكلية</CardTitle>
          <CardDescription>ارفع الشعارات واختر مكانها في التقارير (يمين أو يسار)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label className="mb-2 block">شعار الجامعة</Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 flex flex-col items-center gap-2 min-h-32 justify-center">
                {form.universityLogo ? (
                   
                  <img src={form.universityLogo} alt="شعار الجامعة" className="h-24 object-contain" />
                ) : (
                  <ImageIcon className="size-12 text-muted-foreground" />
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90">
                      <Upload className="size-4" /> رفع
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo('universityLogo')} />
                  </label>
                  {form.universityLogo && (
                    <Button size="sm" variant="outline" onClick={() => upd('universityLogo', '')}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">شعار الكلية</Label>
              <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 flex flex-col items-center gap-2 min-h-32 justify-center">
                {form.facultyLogo ? (
                   
                  <img src={form.facultyLogo} alt="شعار الكلية" className="h-24 object-contain" />
                ) : (
                  <ImageIcon className="size-12 text-muted-foreground" />
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-sm hover:bg-primary/90">
                      <Upload className="size-4" /> رفع
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogo('facultyLogo')} />
                  </label>
                  {form.facultyLogo && (
                    <Button size="sm" variant="outline" onClick={() => upd('facultyLogo', '')}>
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">مكان كل شعار في الترويسة (مرن)</Label>
              <p className="text-xs text-muted-foreground mb-3">
                اختر مكان كل شعار على حدة. يمكن وضع شعار الجامعة على أقصى اليمين وشعار الكلية على أقصى اليسار (أو العكس)، أو وضع الاثنين على نفس الجانب.
              </p>
              <div className="space-y-3">
                <div className="border rounded-md p-3">
                  <Label className="font-semibold mb-2 block">شعار الجامعة</Label>
                  <RadioGroup
                    value={form.universityLogoPosition || 'right'}
                    onValueChange={(v) => upd('universityLogoPosition', v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="right" id="uni-pos-right" />
                      <Label htmlFor="uni-pos-right" className="cursor-pointer">أقصى اليمين</Label>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="left" id="uni-pos-left" />
                      <Label htmlFor="uni-pos-left" className="cursor-pointer">أقصى الشمال</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="border rounded-md p-3">
                  <Label className="font-semibold mb-2 block">شعار الكلية</Label>
                  <RadioGroup
                    value={form.facultyLogoPosition || 'right'}
                    onValueChange={(v) => upd('facultyLogoPosition', v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="right" id="fac-pos-right" />
                      <Label htmlFor="fac-pos-right" className="cursor-pointer">أقصى اليمين</Label>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="left" id="fac-pos-left" />
                      <Label htmlFor="fac-pos-left" className="cursor-pointer">أقصى الشمال</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded">
                  💡 مثال: لوضع شعار الجامعة على أقصى اليمين وشعار الكلية على أقصى اليسار - اختر "أقصى اليمين" للجامعة و"أقصى الشمال" للكلية.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* اسم التقرير */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">اسم/أسماء التقرير في الترويسة</CardTitle>
          <CardDescription>
            قائمة منسدلة قابلة للتعديل - تظهر في منتصف الترويسة مع الشعارات. يمكن اختيار أكثر من اسم لإظهار الترويسة المزدوجة (مثال: صناديق خاصة + موازنة).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* إدارة قائمة أسماء التقارير */}
          <div>
            <Label className="mb-2 block">إدارة قائمة أسماء التقارير (إضافة/تعديل/حذف)</Label>
            <EditableDropdown
              dropdownKey="report_names"
              value=""
              onChange={() => {}}
              placeholder="اضغط زر القائمة لإدارة الأسماء"
              className="max-w-xl"
            />
          </div>

          {/* اختيار أسماء التقارير الظاهرة في الترويسة - مع خانات اختيار واضحة */}
          <div>
            <Label className="mb-2 block font-semibold">اختر الأسماء التي تُكتب في ترويسة التقرير:</Label>
            <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto bg-card">
              {(() => {
                const items = dropdowns['report_names'] || []
                let selected: string[] = []
                try { selected = JSON.parse(form.reportNames || '[]') as string[] } catch { selected = [] }
                if (items.length === 0) {
                  return <p className="text-center text-muted-foreground text-sm py-3">لا توجد أسماء. أضف أسماء من زر "إدارة القائمة" بالأعلى.</p>
                }
                return items.map((item) => {
                  const isChecked = selected.includes(item.value)
                  const isAuto = item.value.includes('صناديق') || item.value.includes('موازنة')
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-all ${isChecked ? 'bg-primary/10 border-primary' : 'bg-surface hover:bg-muted/40 border-border'}`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => {
                          const newSelected = isChecked
                            ? selected.filter((v) => v !== item.value)
                            : [...selected, item.value]
                          upd('reportNames', JSON.stringify(newSelected))
                        }}
                      />
                      <span className="flex-1 text-sm font-medium">{item.value}</span>
                      {isAuto && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          يظهر تلقائيًا حسب نوع الشيت
                        </span>
                      )}
                      {isChecked && !isAuto && (
                        <span className="text-xs text-primary font-semibold">✓ يُكتب في الترويسة</span>
                      )}
                    </label>
                  )
                })
              })()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              * الأسماء المختارة تظهر في السطر الرابع من الترويسة. أسماء "صناديق خاصة" و "موازنة" تظهر تلقائيًا في السطر الثالث حسب نوع الشيت ولا تحتاج لاختيارها.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* التوقيعات تحت الشيت */}
      <SignaturesCard
        signatures={(() => {
          try { return JSON.parse(form.signatures || '[]') as Signature[] } catch { return [] }
        })()}
        onChange={(sigs) => upd('signatures', JSON.stringify(sigs))}
      />

      {/* أنواع الإجازات الحرمانية من المكافآت */}
      <ForfeitingLeaveTypesCard
        selected={(() => {
          try { return JSON.parse(form.forfeitingLeaveTypes || '[]') as string[] } catch { return [] }
        })()}
        onChange={(vals) => upd('forfeitingLeaveTypes', JSON.stringify(vals))}
      />

      {/* مكافآت الدرجات/الوظائف */}
      <RewardsCard />

      {/* معاينة الترويسة */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary">معاينة الترويسة</CardTitle>
          <CardDescription>كيف ستظهر الترويسة في التقارير (تعرض الأسماء والشعارات المختارة)</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border-2 border-primary rounded-lg overflow-hidden bg-white">
            <PreviewHeaderLayout setting={form} />
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground py-2 border-t border-border">
        تصميم: أ. هشام محمد عيد عبد السلام - مدير كلية الحاسبات والذكاء الاصطناعي - جامعة بني سويف
      </div>
    </div>
  )
}

// ---------- التوقيعات تحت الشيت ----------
function SignaturesCard({
  signatures,
  onChange,
}: {
  signatures: Signature[]
  onChange: (sigs: Signature[]) => void
}) {
  const [newLabel, setNewLabel] = React.useState('')
  const [newName, setNewName] = React.useState('')
  const [editIdx, setEditIdx] = React.useState<number | null>(null)
  const [editLabel, setEditLabel] = React.useState('')
  const [editName, setEditName] = React.useState('')

  const addSig = () => {
    if (!newLabel.trim()) {
      toast.error('أدخل اسم التوقيع (مثل: عميد الكلية)')
      return
    }
    onChange([...signatures, { label: newLabel.trim(), name: newName.trim() }])
    setNewLabel('')
    setNewName('')
    toast.success('تمت إضافة التوقيع')
  }

  const delSig = (i: number) => {
    onChange(signatures.filter((_, idx) => idx !== i))
    toast.success('تم الحذف')
  }

  const saveEdit = (i: number) => {
    if (!editLabel.trim()) {
      toast.error('لا يمكن أن يكون الاسم فارغًا')
      return
    }
    const next = [...signatures]
    next[i] = { label: editLabel.trim(), name: editName.trim() }
    onChange(next)
    setEditIdx(null)
    toast.success('تم التعديل')
  }

  return (
    <Card>
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-primary flex items-center gap-2">
          <PenLine className="size-5" /> التوقيعات تحت الشيت
        </CardTitle>
        <CardDescription>
          توقيعات مرنة تظهر أسفل كل شيت وتقرير. يمكن إضافة/تعديل/حذف أي توقيع. كل توقيع يحتوي على عنوان (مثل: عميد الكلية) واسم اختياري.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* قائمة التوقيعات الحالية */}
        <div className="space-y-2">
          {signatures.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">لا توجد توقيعات بعد. أضف توقيعًا جديدًا بالأسفل.</p>
          )}
          {signatures.map((s, i) => (
            <div key={i} className="flex items-center gap-2 border rounded-md p-2 bg-card">
              {editIdx === i ? (
                <>
                  <Input
                    placeholder="عنوان التوقيع"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="الاسم (اختياري)"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="icon" variant="default" onClick={() => saveEdit(i)}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setEditIdx(null)}>
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 flex flex-col">
                    <span className="font-medium">{s.label}</span>
                    {s.name && <span className="text-xs text-muted-foreground">{s.name}</span>}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditIdx(i)
                      setEditLabel(s.label)
                      setEditName(s.name)
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => delSig(i)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* نموذج إضافة توقيع جديد */}
        <div className="border-t pt-4">
          <Label className="mb-2 block">إضافة توقيع جديد</Label>
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="عنوان التوقيع (مثل: عميد الكلية)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="flex-1"
            />
            <Input
              placeholder="الاسم (اختياري - سيظهر تحت العنوان)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addSig}>
              <Plus className="size-4 ml-1" /> إضافة
            </Button>
          </div>
        </div>

        {/* معاينة التوقيعات كما ستظهر تحت الشيت */}
        {signatures.length > 0 && (
          <div className="border-t pt-4">
            <Label className="mb-2 block">معاينة التوقيعات تحت الشيت</Label>
            <div className="border rounded-md p-4 bg-muted/20">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {signatures.map((s, i) => (
                  <div key={i} className="flex flex-col items-center text-center">
                    <div className="w-full border-b-2 border-foreground/70 mb-2 h-10" />
                    <div className="text-sm font-bold">{s.label}</div>
                    {s.name && <div className="text-xs text-muted-foreground">{s.name}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---------- معاينة عنوان الترويسة (يعرض الأسماء المختارة) ----------
function PreviewTitle({ setting }: { setting: Setting }) {
  // Names selected in settings (line 4 candidates)
  let selectedNames: string[] = []
  try {
    selectedNames = JSON.parse(setting.reportNames || '[]')
  } catch {
    selectedNames = []
  }

  // Auto-detect "صناديق" and "موازنة" patterns - they're driven by the sheet type (line 3)
  const isAutoReportName = (n: string): boolean => {
    const norm = (n || '').trim()
    return norm.includes('صناديق') || norm.includes('موازنة') || norm.includes('الموازنة')
  }

  // Line 3: a sample main report name (using currentReportName as preview)
  const line3Name = setting.currentReportName || 'اسم التقرير'

  // Line 4: extra report names (excluding صناديق/موازنة)
  const line4Names = selectedNames.filter((n) => n && n !== line3Name && !isAutoReportName(n))

  return (
    <div className="flex-1 text-center px-4">
      {/* Line 1: University name */}
      <h1 className="text-2xl font-bold text-primary mb-1">{setting.universityName}</h1>
      {/* Line 2: Faculty name */}
      <h2 className="text-xl font-semibold text-foreground mb-2">{setting.facultyName}</h2>
      {/* Line 3: Main report name (auto from sheet type) */}
      <h3 className="text-lg font-bold text-accent-foreground bg-accent/40 inline-block px-4 py-1 rounded">
        {line3Name}
      </h3>
      {/* Line 4: Extra report names selected in settings (excludes صناديق/موازنة) */}
      {line4Names.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {line4Names.map((n, i) => (
            <h4
              key={i}
              className="text-sm font-semibold text-foreground bg-muted/60 inline-block px-3 py-0.5 rounded border border-border"
            >
              {n}
              {i < line4Names.length - 1 && <span className="mr-1 text-primary">•</span>}
            </h4>
          ))}
        </div>
      )}
      {/* Line 5: Year + month + day */}
      <div className="mt-2 text-sm text-muted-foreground">
        العام: {setting.academicYear}
        {setting.month && <span className="mr-4">شهر: {setting.month}</span>}
      </div>
    </div>
  )
}

// ---------- معاينة الترويسة بمواضع الشعارات المنفصلة ----------
function PreviewHeaderLayout({ setting }: { setting: Setting }) {
  const uniPos = setting.universityLogoPosition || setting.logosPosition || 'right'
  const facPos = setting.facultyLogoPosition || setting.logosPosition || 'right'

  const universityLogoEl = setting.universityLogo ? (
    <img src={setting.universityLogo} alt="جامعة" className="h-24 w-24 object-contain" />
  ) : null
  const facultyLogoEl = setting.facultyLogo ? (
    <img src={setting.facultyLogo} alt="كلية" className="h-24 w-24 object-contain" />
  ) : null

  const isSplit = uniPos !== facPos

  if (isSplit) {
    const rightLogo = uniPos === 'right' ? universityLogoEl : facultyLogoEl
    const leftLogo = uniPos === 'right' ? facultyLogoEl : universityLogoEl
    return (
      <div className="flex items-stretch justify-between gap-4 p-4 border-b-4 border-double border-primary bg-card">
        <div className="flex items-center gap-3">{rightLogo}</div>
        <PreviewTitle setting={setting} />
        <div className="flex items-center gap-3">{leftLogo}</div>
      </div>
    )
  }

  const logosSlot = (
    <div className="flex items-center gap-3">
      {universityLogoEl}
      {facultyLogoEl}
    </div>
  )
  const isRight = uniPos !== 'left'
  return (
    <div className="flex items-stretch justify-between gap-4 p-4 border-b-4 border-double border-primary bg-card">
      {isRight ? (
        <>
          {logosSlot}
          <PreviewTitle setting={setting} />
        </>
      ) : (
        <>
          <PreviewTitle setting={setting} />
          {logosSlot}
        </>
      )}
    </div>
  )
}

// ---------- مكافآت الدرجات/الوظائف ----------
// Built-in reward categories - users can add more via the editable dropdown (key: reward_categories)
const DEFAULT_REWARD_CATEGORIES = [
  { key: 'quality', label: 'مكافأة الجودة' },
  { key: 'teaching', label: 'مكافأة التدريس' },
  { key: 'extra_hours', label: 'الساعات الزائدة' },
  { key: 'diff_90', label: 'فروق 90 يوم' },
  { key: 'percent_200', label: 'الـ 200%' },
] as const

// Build the list of reward categories from the dropdown (fall back to defaults)
function useRewardCategories() {
  const { dropdowns } = useStore()
  const custom = dropdowns['reward_categories'] || []
  // If custom list is non-empty, use it; otherwise use defaults
  const list = custom.length > 0
    ? custom.map((c) => ({ key: c.value, label: c.value }))
    : DEFAULT_REWARD_CATEGORIES.map((c) => ({ key: c.key, label: c.label }))
  return list
}

function RewardsCard() {
  const { dropdowns } = useStore()
  const rewardCategories = useRewardCategories()
  const [rewards, setRewards] = React.useState<Reward[]>([])
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    type: 'degree' as 'degree' | 'job',
    name: '',
    category: 'quality',
    rewardType: 'fixed' as 'percent' | 'fixed',
    amount: '0',
  })

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/rewards')
      const data = await r.json()
      setRewards(data)
    } finally {
      setLoading(false)
    }
  }
  React.useEffect(() => { load() }, [])

  const addReward = async () => {
    if (!form.name) {
      toast.error('اختر الدرجة/الوظيفة')
      return
    }
    if (!form.category) {
      toast.error('اختر البند')
      return
    }
    try {
      await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      toast.success('تمت إضافة/تحديث المكافأة')
      setForm({ ...form, amount: '0' })
      load()
    } catch (e) {
      toast.error('فشل الحفظ: ' + (e as Error).message)
    }
  }

  const delReward = async (id: string) => {
    if (!confirm('حذف هذه المكافأة؟')) return
    await fetch('/api/rewards', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    toast.success('تم الحذف')
    load()
  }

  return (
    <Card>
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-primary flex items-center gap-2">
          <Coins className="size-5" /> مكافآت الدرجات والوظائف
        </CardTitle>
        <CardDescription>
          حدد لكل درجة أو وظيفة نوع المكافأة: نسبة % من الأساسي المربوط أو مبلغ مقطوع. تُستخدم هذه القيم لفحص صحة البيانات في تابة الداتا وتلوين القيم غير المطابقة بالأحمر. كل القوائم المنسدلة قابلة للإضافة/التعديل/الحذف مباشرة.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* نموذج الإضافة */}
        <div className="border rounded-md p-3 bg-muted/20">
          <Label className="mb-2 block font-semibold">إضافة/تعديل مكافأة</Label>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
            <div>
              <Label className="text-xs">مبني على (مرن)</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'degree' | 'job', name: '' })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="degree">الدرجة</SelectItem>
                  <SelectItem value="job">الوظيفة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{form.type === 'degree' ? 'الدرجة (قائمة مرنة)' : 'الوظيفة (قائمة مرنة)'}</Label>
              <EditableDropdown
                dropdownKey={form.type === 'degree' ? 'degrees' : 'jobs'}
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder={`اختر ${form.type === 'degree' ? 'الدرجة' : 'الوظيفة'}`}
              />
            </div>
            <div>
              <Label className="text-xs">نوع المكافأة</Label>
              <Select value={form.rewardType} onValueChange={(v) => setForm({ ...form, rewardType: v as 'percent' | 'fixed' })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">مبلغ مقطوع</SelectItem>
                  <SelectItem value="percent">نسبة % من الأساسي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{form.rewardType === 'percent' ? 'النسبة %' : 'المبلغ (جنيه)'}</Label>
              <Input
                type="number"
                min="0"
                step={form.rewardType === 'percent' ? '0.01' : '1'}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="h-9"
                placeholder={form.rewardType === 'percent' ? 'مثال: 25' : 'مثال: 1500'}
              />
            </div>
            <div>
              <Label className="text-xs">البند (قائمة مرنة)</Label>
              <EditableDropdown
                dropdownKey="reward_categories"
                value={form.category}
                onChange={(v) => setForm({ ...form, category: v })}
                placeholder="اختر البند"
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button onClick={addReward}>
              <Plus className="size-4 ml-1" /> حفظ المكافأة
            </Button>
          </div>
        </div>

        {/* جدول المكافآت الحالية */}
        <div>
          <Label className="mb-2 block font-semibold">المكافآت المُسجّلة ({rewards.length})</Label>
          {loading ? (
            <p className="text-center text-muted-foreground py-4">جارٍ التحميل...</p>
          ) : rewards.length === 0 ? (
            <div className="text-center py-6 border rounded-md bg-muted/20 text-muted-foreground text-sm">
              لا توجد مكافآت مسجلة. أضف مكافأة بالأعلى.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-md max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-primary text-primary-foreground">
                  <tr>
                    <th className="text-right p-2">مبني على</th>
                    <th className="text-right p-2">الدرجة/الوظيفة</th>
                    <th className="text-right p-2">البند</th>
                    <th className="text-center p-2">النوع</th>
                    <th className="text-center p-2">القيمة</th>
                    <th className="text-center p-2">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r) => {
                    const cat = rewardCategories.find((c) => c.key === r.category)
                    return (
                      <tr key={r.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <Badge variant="outline">{r.type === 'degree' ? 'الدرجة' : 'الوظيفة'}</Badge>
                        </td>
                        <td className="p-2 font-medium">{r.name}</td>
                        <td className="p-2">{cat?.label || r.category}</td>
                        <td className="p-2 text-center">
                          {r.rewardType === 'percent' ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">نسبة %</Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">مبلغ مقطوع</Badge>
                          )}
                        </td>
                        <td className="p-2 text-center font-mono font-bold">
                          {r.rewardType === 'percent' ? `${formatNumber(parseNumber(r.amount))}%` : formatNumber(r.amount)}
                        </td>
                        <td className="p-2 text-center">
                          <Button size="icon" variant="ghost" onClick={() => delReward(r.id)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------- أنواع الإجازات الحرمانية من المكافآت ----------
function ForfeitingLeaveTypesCard({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (vals: string[]) => void
}) {
  const { dropdowns, addDropdown } = useStore()
  const leaveTypes = dropdowns['leave_types'] || []
  const [newType, setNewType] = React.useState('')

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const addCustom = async () => {
    if (!newType.trim()) return
    // First add to leave_types dropdown
    await addDropdown('leave_types', newType.trim())
    // Then add to forfeiting list
    if (!selected.includes(newType.trim())) {
      onChange([...selected, newType.trim()])
    }
    setNewType('')
    toast.success('تمت إضافة نوع الإجازة')
  }

  return (
    <Card>
      <CardHeader className="bg-primary/5">
        <CardTitle className="text-primary flex items-center gap-2">
          <Ban className="size-5" /> أنواع الإجازات الحرمانية من المكافآت
        </CardTitle>
        <CardDescription>
          حدد أنواع الإجازات التي تستوجب حرمان صاحبها من جميع المكافآت (في صناديق + موازنة). عند اختيار نوع هنا، أي دكتور يأخذ إجازة من هذا النوع في فترة الصرف يتم تصفير مكافآته تلقائيًا وتلوين صفه بالأحمر. القائمة مرنة - يمكن إضافة أنواع جديدة.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* اختيار أنواع الإجازات الحرمانية */}
        <div>
          <Label className="mb-2 block">اختر أنواع الإجازات الحرمانية (من قائمة أنواع الإجازات)</Label>
          {leaveTypes.length === 0 ? (
            <div className="text-center py-4 border rounded-md bg-muted/20 text-muted-foreground text-sm">
              لا توجد أنواع إجازات مسجلة. أضف نوعًا جديدًا بالأسفل أو من تابة الإجازات.
            </div>
          ) : (
            <div className="border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto bg-card">
              {leaveTypes.map((lt) => {
                const isSelected = selected.includes(lt.value)
                return (
                  <label
                    key={lt.id}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer border ${isSelected ? 'bg-red-50 border-red-300' : 'hover:bg-muted/40'}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(lt.value)}
                    />
                    <span className="text-sm flex-1">{lt.value}</span>
                    {isSelected && (
                      <span className="text-xs text-red-700 font-semibold">حرمان من المكافآت</span>
                    )}
                  </label>
                )
              })}
            </div>
          )}
        </div>

        {/* إضافة نوع إجازة جديد */}
        <div className="border-t pt-3">
          <Label className="mb-2 block">إضافة نوع إجازة جديد للقائمة</Label>
          <div className="flex gap-2">
            <Input
              placeholder="مثال: إجازة رعاية طفل..."
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustom()
                }
              }}
            />
            <Button onClick={addCustom}>
              <Plus className="size-4 ml-1" /> إضافة
            </Button>
          </div>
        </div>

        {/* عرض الأنواع المختارة حالياً */}
        {selected.length > 0 && (
          <div className="border-t pt-3">
            <Label className="mb-2 block">الأنواع الحرمانية المختارة ({selected.length}):</Label>
            <div className="flex flex-wrap gap-2">
              {selected.map((s, i) => (
                <Badge
                  key={i}
                  className="bg-red-100 text-red-800 hover:bg-red-100 cursor-pointer"
                  onClick={() => toggle(s)}
                  title="اضغط للحذف"
                >
                  {s}
                  <X className="size-3 mr-1" />
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              * اضغط على أي نوع لإزالته من قائمة الحرمان.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
