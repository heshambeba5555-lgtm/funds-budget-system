import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  let s = await db.setting.findUnique({ where: { id: 'global' } })
  if (!s) {
    s = await db.setting.create({ data: { id: 'global' } })
  }
  return NextResponse.json(s)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const data: Record<string, unknown> = {}
  const allowed = [
    'universityName','facultyName','deanName','directorName','assistantDirectorName',
    'cadreOfficerName','financialAffairsOfficerName',
    'administrationName','jobName','degreeName',
    'academicYear','month','day',
    'universityLogo','facultyLogo',
    'universityLogoPosition','facultyLogoPosition','logosPosition',
    'currentReportName','reportNames',
    'signatures','forfeitingLeaveTypes'
  ]
  for (const k of allowed) {
    if (k in body) data[k] = body[k]
  }
  const s = await db.setting.upsert({
    where: { id: 'global' },
    update: data,
    create: { id: 'global', ...data },
  })
  return NextResponse.json(s)
}
