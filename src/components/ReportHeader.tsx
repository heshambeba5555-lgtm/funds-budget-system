'use client'

import { useStore } from '@/lib/store'

type Props = {
  reportName?: string
  showLogos?: boolean
}

// Header with logos and report name(s) in center.
// Each logo can be positioned individually (right or left).
//
// Layout strategy:
// - Line 1 (h1): University name (e.g. جامعة بني سويف)
// - Line 2 (h2): Faculty name (e.g. كلية الحاسبات والذكاء الاصطناعي)
// - Line 3 (h3): The main report name - automatically reflects the sheet type
//   (صناديق خاصة أعضاء هيئة التدريس ومعاونيهم / موازنة أعضاء هيئة التدريس ومعاونيهم)
//   This is driven by the `reportName` prop (passed by the calling tab).
// - Line 4: Optional extra report names selected in settings (e.g. تقرير الإجازات, تقرير المكافآت)
//   EXCLUDING "صناديق خاصة" and "موازنة" variants (those are shown in line 3 automatically).
// - Line 5: العام (was: العام الجامعي) + month + day
export function ReportHeader({ reportName, showLogos = true }: Props) {
  const { setting } = useStore()
  if (!setting) return null

  // Names selected in settings (line 4 candidates)
  let selectedExtraNames: string[] = []
  try {
    selectedExtraNames = JSON.parse(setting.reportNames || '[]')
  } catch {
    selectedExtraNames = []
  }

  // Auto-detect "صناديق" and "موازنة" patterns - those are driven by the sheet type
  // (they appear in line 3 via reportName), so we exclude them from line 4.
  const isAutoReportName = (n: string): boolean => {
    const norm = (n || '').trim()
    return (
      norm.includes('صناديق') ||
      norm.includes('موازنة') ||
      norm.includes('صناديق خاصة') ||
      norm.includes('الموازنة')
    )
  }

  // Line 3: the main report name (auto from sheet type)
  const line3Name = reportName || setting.currentReportName || ''

  // Line 4: extra report names selected in settings, excluding the auto ones
  const line4Names = selectedExtraNames.filter((n) => n && n !== line3Name && !isAutoReportName(n))

  // Logo positions (use new fields; fallback to legacy logosPosition)
  const uniPos = setting.universityLogoPosition || setting.logosPosition || 'right'
  const facPos = setting.facultyLogoPosition || setting.logosPosition || 'right'

  const universityLogoEl = setting.universityLogo && showLogos ? (
    <img src={setting.universityLogo} alt="شعار الجامعة" className="h-24 w-24 object-contain" />
  ) : null
  const facultyLogoEl = setting.facultyLogo && showLogos ? (
    <img src={setting.facultyLogo} alt="شعار الكلية" className="h-24 w-24 object-contain" />
  ) : null

  // Determine the layout based on positions
  // - "split" mode: one logo on each side
  const isSplit = uniPos !== facPos

  const titleSlot = (
    <div className="flex-1 text-center px-4">
      {/* Line 1: University name */}
      <h1 className="text-2xl font-bold text-primary mb-1">{setting.universityName}</h1>
      {/* Line 2: Faculty name */}
      <h2 className="text-xl font-semibold text-foreground mb-2">{setting.facultyName}</h2>
      {/* Line 3: Main report name (auto from sheet type) */}
      {line3Name && (
        <h3 className="text-lg font-bold text-accent-foreground bg-accent/40 inline-block px-4 py-1 rounded">
          {line3Name}
        </h3>
      )}
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
        {setting.day && <span className="mr-4">اليوم: {setting.day}</span>}
      </div>
    </div>
  )

  if (isSplit) {
    // Split layout: one logo on each side, title in the middle
    // If uniPos is "right", university logo is on the right, faculty on left (and vice versa)
    const rightLogo = uniPos === 'right' ? universityLogoEl : facultyLogoEl
    const leftLogo = uniPos === 'right' ? facultyLogoEl : universityLogoEl
    return (
      <div className="flex items-stretch justify-between gap-4 p-4 border-b-4 border-double border-primary bg-card">
        {/* In RTL, the first child is on the right */}
        <div className="flex items-center gap-3">{rightLogo}</div>
        {titleSlot}
        <div className="flex items-center gap-3">{leftLogo}</div>
      </div>
    )
  }

  // Both logos on same side
  const logosSlot = (
    <div className="flex items-center gap-3">
      {universityLogoEl}
      {facultyLogoEl}
    </div>
  )
  const isRight = uniPos !== 'left' // default right
  return (
    <div className="flex items-stretch justify-between gap-4 p-4 border-b-4 border-double border-primary bg-card">
      {isRight ? (
        <>
          {logosSlot}
          {titleSlot}
        </>
      ) : (
        <>
          {titleSlot}
          {logosSlot}
        </>
      )}
    </div>
  )
}
