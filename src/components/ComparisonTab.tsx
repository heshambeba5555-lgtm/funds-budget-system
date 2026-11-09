'use client'

import * as React from 'react'
import { Upload, FileWarning, CheckCircle2, AlertCircle, Save, History, Trash2, FileText, FileUp, Pencil, X, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { parseNumber, formatNumber } from '@/lib/helpers'
import type { Member } from '@/lib/store'

type ParsedEntry = {
  name: string
  amount: string
  nationalId?: string
  rawLine?: string
  page?: number
}

type MatchStatus = 'matched' | 'missing_in_pdf' | 'extra_in_pdf' | 'different'
type MatchResult = {
  sheetName: string
  sheetNationalId: string
  sheetAmount: number
  pdfName?: string
  pdfAmount?: number
  diff: number
  status: MatchStatus
  note: string
}

type HistoryItem = {
  id: string
  kind: 'funds' | 'budget'
  referenceTotal: string
  sheetTotal: string
  diff: string
  report: string
  createdAt: string
}

export function ComparisonTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">تابة المقارنة</h2>
        <p className="text-muted-foreground">
          ارفع ملف PDF يحتوي على إجمالي استحقاقات كل دكتور، ويتم مقارنته بالشيت (الشيت هو المرجع).
          يظهر تقرير بالناقص والزايد والاختلافات.
        </p>
      </div>
      <Tabs defaultValue="funds">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="funds">صناديق خاصة</TabsTrigger>
          <TabsTrigger value="budget">الموازنة</TabsTrigger>
        </TabsList>
        <TabsContent value="funds">
          <ComparisonView kind="funds" />
        </TabsContent>
        <TabsContent value="budget">
          <ComparisonView kind="budget" />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ComparisonView({ kind }: { kind: 'funds' | 'budget' }) {
  const [rows, setRows] = React.useState<Member[]>([])
  const [pdfEntries, setPdfEntries] = React.useState<ParsedEntry[]>([])
  const [pdfFileName, setPdfFileName] = React.useState('')
  const [parsing, setParsing] = React.useState(false)
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [editIdx, setEditIdx] = React.useState<number | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const load = async () => {
    const r = await fetch(`/api/members?kind=${kind}`)
    const data = await r.json()
    setRows(data)
    const r2 = await fetch('/api/comparison')
    const all = (await r2.json()) as HistoryItem[]
    setHistory(all.filter((h) => h.kind === kind))
  }
  React.useEffect(() => { load() }, [kind])

  const sheetTotal = rows.reduce((s, r) => s + parseNumber(r.total), 0)
  const pdfTotal = pdfEntries.reduce((s, e) => s + parseNumber(e.amount), 0)

  const uploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('الملف يجب أن يكون PDF')
      return
    }
    setParsing(true)
    setPdfFileName(file.name)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const r = await fetch('/api/compare/pdf', { method: 'POST', body: fd })
      const j = await r.json()
      if (j.ok) {
        setPdfEntries(j.entries)
        toast.success(`تم استخراج ${j.entries.length} دكتور من PDF (${j.totalPages} صفحات)`)
      } else {
        toast.error(j.error || 'فشل قراءة PDF')
      }
    } catch (err) {
      toast.error('فشل رفع PDF: ' + (err as Error).message)
    } finally {
      setParsing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const updEntry = (i: number, key: keyof ParsedEntry, value: string) => {
    setPdfEntries((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [key]: value }
      return next
    })
  }
  const delEntry = (i: number) => {
    setPdfEntries(pdfEntries.filter((_, idx) => idx !== i))
  }
  const addEntry = () => {
    setPdfEntries([...pdfEntries, { name: '', amount: '0' }])
  }

  // Run the comparison - SHEET IS THE REFERENCE
  const runComparison = (): MatchResult[] => {
    const results: MatchResult[] = []
    // Normalize names for matching (lowercase, collapse whitespace)
    const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
    // Reversed variant (in case PDF stores Arabic visually reversed)
    const reversed = (s: string) => s.trim().split(/\s+/).reverse().join(' ')
    // Build a lookup from PDF entries by name and by nationalId
    const pdfByName = new Map<string, ParsedEntry>()
    const pdfByRevName = new Map<string, ParsedEntry>()
    const pdfByNatId = new Map<string, ParsedEntry>()
    for (const e of pdfEntries) {
      if (e.name) {
        pdfByName.set(norm(e.name), e)
        pdfByRevName.set(norm(reversed(e.name)), e)
      }
      if (e.nationalId) {
        pdfByNatId.set(e.nationalId, e)
      }
    }

    // For each sheet row, try to find a match in PDF
    for (const r of rows) {
      const sheetName = r.name || r.code || ''
      if (!sheetName) continue
      const sheetAmount = parseNumber(r.total)
      const sheetNationalId = r.nationalId || ''

      // 1) Try matching by national ID first (most reliable)
      let matched: ParsedEntry | undefined
      if (sheetNationalId) {
        matched = pdfByNatId.get(sheetNationalId)
      }
      // 2) Try matching by exact name
      if (!matched) {
        matched = pdfByName.get(norm(sheetName))
      }
      // 3) Try matching by reversed name (PDF stored visually reversed)
      if (!matched) {
        matched = pdfByRevName.get(norm(sheetName))
      }

      if (!matched) {
        // Doctor in sheet but missing from PDF
        results.push({
          sheetName,
          sheetNationalId,
          sheetAmount,
          diff: sheetAmount,
          status: 'missing_in_pdf',
          note: 'الدكتور موجود في الشيت لكنه ناقص من ملف PDF',
        })
      } else {
        const pdfAmount = parseNumber(matched.amount)
        const diff = sheetAmount - pdfAmount
        if (Math.abs(diff) < 0.01) {
          results.push({
            sheetName,
            sheetNationalId,
            sheetAmount,
            pdfName: matched.name,
            pdfAmount,
            diff: 0,
            status: 'matched',
            note: 'مطابق تمامًا',
          })
        } else {
          results.push({
            sheetName,
            sheetNationalId,
            sheetAmount,
            pdfName: matched.name,
            pdfAmount,
            diff,
            status: 'different',
            note:
              diff > 0
                ? `الاستحقاق في الشيت أكبر من PDF بمقدار ${formatNumber(Math.abs(diff))}`
                : `الاستحقاق في PDF أكبر من الشيت بمقدار ${formatNumber(Math.abs(diff))}`,
          })
        }
      }
    }

    // Find PDF entries not matched in sheet (extra in PDF)
    const sheetNatIds = new Set(rows.map((r) => r.nationalId).filter(Boolean))
    const matchedPdfEntries = new Set<ParsedEntry>()
    for (const r of rows) {
      if (r.nationalId && pdfByNatId.has(r.nationalId)) {
        matchedPdfEntries.add(pdfByNatId.get(r.nationalId)!)
      }
    }
    for (const e of pdfEntries) {
      if (!e.name) continue
      if (matchedPdfEntries.has(e)) continue
      // Check if any sheet row matches by name (forward or reversed)
      const normName = norm(e.name)
      const revName = norm(reversed(e.name))
      const sheetMatch = rows.find(
        (r) => norm(r.name || '') === normName || norm(r.name || '') === revName
      )
      if (!sheetMatch) {
        results.push({
          sheetName: '',
          sheetNationalId: '',
          sheetAmount: 0,
          pdfName: e.name,
          pdfAmount: parseNumber(e.amount),
          diff: parseNumber(e.amount),
          status: 'extra_in_pdf',
          note: 'الدكتور موجود في PDF لكنه زائد (غير موجود في الشيت)',
        })
      }
    }

    return results
  }

  const results = pdfEntries.length > 0 ? runComparison() : []

  const stats = {
    matched: results.filter((r) => r.status === 'matched').length,
    different: results.filter((r) => r.status === 'different').length,
    missing: results.filter((r) => r.status === 'missing_in_pdf').length,
    extra: results.filter((r) => r.status === 'extra_in_pdf').length,
  }

  const generateReport = (): string => {
    if (pdfEntries.length === 0) return 'لم يتم رفع ملف PDF بعد.'
    const lines: string[] = []
    lines.push('═══════════════════════════════════════')
    lines.push('     تقرير المقارنة - الشيت هو المرجع')
    lines.push('═══════════════════════════════════════')
    lines.push(`النوع: ${kind === 'funds' ? 'صناديق خاصة' : 'موازنة'}`)
    lines.push(`ملف PDF: ${pdfFileName || 'غير محدد'}`)
    lines.push(`عدد الدكاترة في الشيت: ${rows.length}`)
    lines.push(`عدد الدكاترة في PDF: ${pdfEntries.length}`)
    lines.push(`إجمالي الشيت (المرجع): ${formatNumber(sheetTotal)}`)
    lines.push(`إجمالي PDF: ${formatNumber(pdfTotal)}`)
    lines.push(`الفرق الكلي: ${formatNumber(sheetTotal - pdfTotal)}`)
    lines.push('')
    lines.push('--- ملخص النتائج ---')
    lines.push(`✓ مطابق: ${stats.matched}`)
    lines.push(`⚠ مختلف: ${stats.different}`)
    lines.push(`✗ ناقص في PDF: ${stats.missing}`)
    lines.push(`+ زائد في PDF: ${stats.extra}`)
    lines.push('')
    if (stats.different > 0) {
      lines.push('--- الاختلافات (دكاترة في الشيت وPDF لكن بأرقام مختلفة) ---')
      results
        .filter((r) => r.status === 'different')
        .forEach((r, i) => {
          lines.push(`${i + 1}. ${r.sheetName}: الشيت=${formatNumber(r.sheetAmount)} | PDF=${formatNumber(r.pdfAmount || 0)} | الفرق=${formatNumber(Math.abs(r.diff))}`)
        })
      lines.push('')
    }
    if (stats.missing > 0) {
      lines.push('--- دكاترة في الشيت ناقصون من PDF ---')
      results
        .filter((r) => r.status === 'missing_in_pdf')
        .forEach((r, i) => {
          lines.push(`${i + 1}. ${r.sheetName} (إجمالي الشيت: ${formatNumber(r.sheetAmount)})`)
        })
      lines.push('')
    }
    if (stats.extra > 0) {
      lines.push('--- دكاترة في PDF زائدون عن الشيت ---')
      results
        .filter((r) => r.status === 'extra_in_pdf')
        .forEach((r, i) => {
          lines.push(`${i + 1}. ${r.pdfName} (مبلغ PDF: ${formatNumber(r.pdfAmount || 0)})`)
        })
      lines.push('')
    }
    lines.push('ملاحظة: الشيت هو المرجع النهائي للمقارنة.')
    return lines.join('\n')
  }

  const report = generateReport()

  const saveReport = async () => {
    if (pdfEntries.length === 0) {
      toast.error('ارفع ملف PDF أولاً')
      return
    }
    await fetch('/api/comparison', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        referenceTotal: formatNumber(pdfTotal),
        sheetTotal: formatNumber(sheetTotal),
        diff: formatNumber(Math.abs(sheetTotal - pdfTotal)),
        report,
      }),
    })
    toast.success('تم حفظ تقرير المقارنة')
    load()
  }

  const delHistory = async (id?: string) => {
    if (!confirm(id ? 'حذف هذا السجل؟' : 'حذف كل السجلات؟')) return
    await fetch('/api/comparison', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id ? { id } : {}),
    })
    toast.success('تم الحذف')
    load()
  }

  return (
    <div className="space-y-4">
      {/* رفع PDF */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary flex items-center gap-2">
            <FileUp className="size-5" /> رفع ملف PDF (إجمالي الاستحقاقات لكل دكتور)
          </CardTitle>
          <CardDescription>
            ارفع ملف PDF يحتوي على إجمالي استحقاقات كل دكتور. سيتم استخراج الأسماء والمبالغ تلقائيًا ويمكنك تعديلها يدويًا قبل المقارنة.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-md text-sm font-medium">
                <Upload className="size-4" /> اختر ملف PDF
              </span>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={uploadPdf} />
            </label>
            {pdfFileName && (
              <Badge variant="secondary" className="text-sm">
                <FileText className="size-3 ml-1" /> {pdfFileName}
              </Badge>
            )}
            {parsing && <span className="text-sm text-muted-foreground">جارٍ التحليل...</span>}
          </div>

          {/* ملخص سريع */}
          {pdfEntries.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border rounded-md p-3 bg-green-50">
                <div className="text-xs text-muted-foreground">دكاترة الشيت</div>
                <div className="text-xl font-bold text-green-700">{rows.length}</div>
              </div>
              <div className="border rounded-md p-3 bg-blue-50">
                <div className="text-xs text-muted-foreground">دكاترة PDF</div>
                <div className="text-xl font-bold text-blue-700">{pdfEntries.length}</div>
              </div>
              <div className="border rounded-md p-3 bg-primary/10">
                <div className="text-xs text-muted-foreground">إجمالي الشيت (مرجع)</div>
                <div className="text-lg font-bold text-primary">{formatNumber(sheetTotal)}</div>
              </div>
              <div className="border rounded-md p-3 bg-accent/40">
                <div className="text-xs text-muted-foreground">إجمالي PDF</div>
                <div className="text-lg font-bold text-accent-foreground">{formatNumber(pdfTotal)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* جدول بيانات PDF المستخرجة (قابل للتعديل) */}
      {pdfEntries.length > 0 && (
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="size-5" /> بيانات PDF المستخرجة ({pdfEntries.length} دكتور)
              </span>
              <Button size="sm" variant="outline" onClick={addEntry}>
                + إضافة صف
              </Button>
            </CardTitle>
            <CardDescription>
              راجع البيانات المستخرجة وعدّلها إن لزم. المطابقة بالاسم أو الرقم القومي.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-primary text-primary-foreground">
                  <tr>
                    <th className="p-2 text-right">الاسم (من PDF)</th>
                    <th className="p-2 text-center">الرقم القومي</th>
                    <th className="p-2 text-center">المبلغ</th>
                    <th className="p-2 text-center">الصفحة</th>
                    <th className="p-2 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {pdfEntries.map((e, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="p-2">
                        {editIdx === i ? (
                          <Input
                            value={e.name}
                            onChange={(ev) => updEntry(i, 'name', ev.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{e.name}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {editIdx === i ? (
                          <Input
                            value={e.nationalId || ''}
                            onChange={(ev) => updEntry(i, 'nationalId', ev.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">{e.nationalId || '-'}</span>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {editIdx === i ? (
                          <Input
                            type="number"
                            value={e.amount}
                            onChange={(ev) => updEntry(i, 'amount', ev.target.value)}
                            className="h-8 w-32 mx-auto"
                          />
                        ) : (
                          formatNumber(e.amount)
                        )}
                      </td>
                      <td className="p-2 text-center text-xs text-muted-foreground">{e.page || '-'}</td>
                      <td className="p-2 text-center">
                        {editIdx === i ? (
                          <div className="flex justify-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditIdx(null)}>
                              <Check className="size-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1">
                            <Button size="icon" variant="ghost" onClick={() => setEditIdx(i)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => delEntry(i)}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتائج المقارنة */}
      {pdfEntries.length > 0 && (
        <Card>
          <CardHeader className="bg-primary/5">
            <CardTitle className="text-primary">نتائج المقارنة</CardTitle>
            <CardDescription>الشيت هو المرجع. المطابقة بالاسم أو الرقم القومي.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* بطاقات الملخص */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border-2 border-green-500 bg-green-50 rounded-lg p-3 text-center">
                <CheckCircle2 className="size-6 mx-auto text-green-600 mb-1" />
                <div className="text-2xl font-bold text-green-700">{stats.matched}</div>
                <div className="text-xs text-green-700">مطابق</div>
              </div>
              <div className="border-2 border-amber-500 bg-amber-50 rounded-lg p-3 text-center">
                <AlertCircle className="size-6 mx-auto text-amber-600 mb-1" />
                <div className="text-2xl font-bold text-amber-700">{stats.different}</div>
                <div className="text-xs text-amber-700">مختلف</div>
              </div>
              <div className="border-2 border-red-500 bg-red-50 rounded-lg p-3 text-center">
                <FileWarning className="size-6 mx-auto text-red-600 mb-1" />
                <div className="text-2xl font-bold text-red-700">{stats.missing}</div>
                <div className="text-xs text-red-700">ناقص في PDF</div>
              </div>
              <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-3 text-center">
                <FileUp className="size-6 mx-auto text-blue-600 mb-1" />
                <div className="text-2xl font-bold text-blue-700">{stats.extra}</div>
                <div className="text-xs text-blue-700">زائد في PDF</div>
              </div>
            </div>

            {/* جدول النتائج التفصيلية */}
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="border-b-2">
                    <th className="p-2 text-right">الدكتور (الشيت)</th>
                    <th className="p-2 text-center">الشيت</th>
                    <th className="p-2 text-center">PDF</th>
                    <th className="p-2 text-center">الفرق</th>
                    <th className="p-2 text-center">الحالة</th>
                    <th className="p-2 text-right">ملاحظة</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={i}
                      className={`border-b ${
                        r.status === 'matched'
                          ? 'bg-green-50/50'
                          : r.status === 'different'
                          ? 'bg-amber-50/50'
                          : r.status === 'missing_in_pdf'
                          ? 'bg-red-50/50'
                          : 'bg-blue-50/50'
                      }`}
                    >
                      <td className="p-2">
                        <div className="font-medium">{r.sheetName || r.pdfName || '-'}</div>
                        {r.sheetNationalId && (
                          <div className="text-xs text-muted-foreground">قومي: {r.sheetNationalId}</div>
                        )}
                      </td>
                      <td className="p-2 text-center font-mono">{formatNumber(r.sheetAmount)}</td>
                      <td className="p-2 text-center font-mono">{r.pdfAmount !== undefined ? formatNumber(r.pdfAmount) : '-'}</td>
                      <td className="p-2 text-center font-mono font-bold">
                        {r.diff === 0 ? '-' : formatNumber(Math.abs(r.diff))}
                      </td>
                      <td className="p-2 text-center">
                        {r.status === 'matched' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مطابق</Badge>}
                        {r.status === 'different' && <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">مختلف</Badge>}
                        {r.status === 'missing_in_pdf' && <Badge className="bg-red-100 text-red-800 hover:bg-red-100">ناقص في PDF</Badge>}
                        {r.status === 'extra_in_pdf' && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">زائد في PDF</Badge>}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{r.note}</td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr><td colSpan={6} className="text-center p-4 text-muted-foreground">لا توجد نتائج</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* تقرير الأخطاء النصي */}
            <div>
              <Label className="mb-2 block">تقرير الأخطاء (المرجع)</Label>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/30 p-4 rounded-md border max-h-96 overflow-y-auto">
                {report}
              </pre>
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={saveReport} variant="default">
                <Save className="size-4 ml-1" /> حفظ تقرير المقارنة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* سجل المقارنات */}
      <Card>
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-primary flex items-center gap-2">
            <History className="size-5" /> سجل المقارنات
          </CardTitle>
          <CardDescription>المقارنات السابقة المحفوظة</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary bg-primary/5">
                  <th className="text-right p-2">التاريخ</th>
                  <th className="text-right p-2">إجمالي PDF</th>
                  <th className="text-right p-2">إجمالي الشيت</th>
                  <th className="text-right p-2">الفرق</th>
                  <th className="text-center p-2">الحالة</th>
                  <th className="text-center p-2">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">لا يوجد سجل بعد</td></tr>
                )}
                {history.map((h) => {
                  const d = parseNumber(h.diff)
                  return (
                    <tr key={h.id} className="border-b hover:bg-muted/30">
                      <td className="p-2 text-xs">{new Date(h.createdAt).toLocaleString('ar-EG')}</td>
                      <td className="p-2 font-mono">{h.referenceTotal}</td>
                      <td className="p-2 font-mono">{h.sheetTotal}</td>
                      <td className="p-2 font-mono font-bold">{h.diff}</td>
                      <td className="p-2 text-center">
                        {d === 0 ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">مطابق</Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">فروقات</Badge>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <Button size="icon" variant="ghost" onClick={() => delHistory(h.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {history.length > 0 && (
            <div className="text-center mt-3">
              <Button variant="ghost" size="sm" onClick={() => delHistory()}>
                حذف الكل
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
