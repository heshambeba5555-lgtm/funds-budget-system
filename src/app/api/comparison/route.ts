import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const items = await db.comparisonRef.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await db.comparisonRef.create({
    data: {
      kind: body.kind || 'funds',
      referenceTotal: String(body.referenceTotal ?? ''),
      sheetTotal: String(body.sheetTotal ?? ''),
      diff: String(body.diff ?? ''),
      report: body.report || '',
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (id) {
    await db.comparisonRef.delete({ where: { id } })
  } else {
    await db.comparisonRef.deleteMany({})
  }
  return NextResponse.json({ ok: true })
}
